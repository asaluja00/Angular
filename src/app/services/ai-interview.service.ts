// ...existing code...

import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, from, throwError, of } from 'rxjs';
import { catchError, switchMap, tap, filter } from 'rxjs/operators';
// Use the browser-provided Microsoft Speech SDK if available on window (recommended for Angular browser builds).
// To use this, include the browser bundle script in index.html and expose SpeechSDK on window.
const speechsdk: any = (window as any).SpeechSDK;
import { environment } from '../components/environment/environment';
import { Config } from '../components/utils/config';


// Define interfaces for conversation entries
export interface ConversationEntry {
  role: 'system' | 'user';
  content: string;
  timestamp: Date;
}

// Interface for the LLaMA response via Azure OpenAI
export interface LlamaResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: any[];
    };
    logprobs: null;
    finish_reason: string;
    stop_reason: null;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  prompt_logprobs: null;
}

@Injectable({
  providedIn: 'root'
})
export class AiInterviewService {
  private isSpeaking: boolean = false;
  // Azure Speech SDK configuration (typed as any because SDK types are provided at runtime)
  private speechConfig: any;
  private recognizer: any;
  private synthesizer: any = null;

  // Azure OpenAI/LLaMA configuration
  private azureOpenAIEndpoint = environment.azureOpenAI.endpoint;
  private azureOpenAIKey = environment.azureOpenAI.key;
  private azureOpenAIModel = environment.azureOpenAI.model;

  // Stream for recognized text
  private recognizedTextSubject = new Subject<string>();
  public recognizedText$ = this.recognizedTextSubject.asObservable();

  // Conversation history
  private conversationHistorySubject = new BehaviorSubject<ConversationEntry[]>([]);
  public conversationHistory$ = this.conversationHistorySubject.asObservable();

  // Service state
  private isListeningSubject = new BehaviorSubject<boolean>(false);
  public isListening$ = this.isListeningSubject.asObservable();

  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  public isProcessing$ = this.isProcessingSubject.asObservable();

  private hasErrorSubject = new BehaviorSubject<string | null>(null);
  public hasError$ = this.hasErrorSubject.asObservable();


  

  getCandidateImage(interviewId: string): Observable<Blob> {
    const url = `${environment.url1}/candidate-image`;
    const payload = { interview_id: interviewId };
    return this.http.post(url, payload, { responseType: 'blob' });
  }
  generateTranscript(payload: any): Observable<any> {
    // Assuming there's an endpoint to get candidate details
    const url = `${environment.url1}${Config.GENERATE_TRANSCRIPT}`;
    return this.http.post<any>(url, payload);
  }
  /**
   * Sets the conversation history to only a system and user message, matching backend expectations.
   */
  public setSystemAndUserHistory(systemPrompt: string, userMessage: string): void {
    const history: ConversationEntry[] = [
      { role: 'system', content: systemPrompt, timestamp: new Date() },
      { role: 'user', content: userMessage, timestamp: new Date() }
    ];
    this.conversationHistorySubject.next(history);
  }


  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
  ) {
    // Initialize Azure Speech SDK
    this.speechConfig = speechsdk.SpeechConfig.fromSubscription(
      environment.azureSpeech.subscriptionKey,
      environment.azureSpeech.region
    );
    this.speechConfig.speechRecognitionLanguage = environment.azureSpeech.recognitionLanguage;
    this.speechConfig.speechSynthesisVoiceName = environment.azureSpeech.voiceName;

    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    this.recognizer = new speechsdk.SpeechRecognizer(this.speechConfig, audioConfig);
    // System prompt will be added to conversation history when setSystemPrompt is called
  }

  /**
   * Start the interview session
   * Initializes STT and begins listening for user input
   */
  public startInterview(): Observable<boolean> {
    if (this.isListeningSubject.value) {
      // console.log('[SpeechSDK] Already listening, skipping setup');
      return of(true); // Already listening
    }
    return this.setupSpeechRecognition().pipe(
      tap(() => {
        this.isListeningSubject.next(true);
        console.log('[SpeechSDK] Interview started, listening for speech');
      }),
      switchMap(() => of(true)),
      catchError((error: any) => {
        this.handleError('Failed to start interview', error);
        return of(false);
      })
    );
  }

  /**
   * Stop the interview session
   * Stops listening and cleans up resources
   */
  public stopInterview(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      try {
        // Stop speech recognition
        if (this.recognizer) {
          this.recognizer.stopContinuousRecognitionAsync(
            () => {
              this.ngZone.run(() => {
                // this.recognizer = null;
                this.isListeningSubject.next(false);
                console.log('Interview stopped');
                observer.next(true);
                observer.complete();
              });
            },
            (error: any) => {
              this.ngZone.run(() => {
                this.handleError('Error stopping speech recognition', error);
                observer.error(error);
              });
            }
          );
        } else {
          this.isListeningSubject.next(false);
          observer.next(true);
          observer.complete();
        }
      } catch (error) {
        this.ngZone.run(() => {
          this.handleError('Error stopping interview', error);
          observer.error(error);
        });
      }
    });
  }

  /**
   * Get the current conversation history
   */
  public getConversationHistory(): ConversationEntry[] {
    return this.conversationHistorySubject.value;
  }
  /**
 * Returns conversation history with only 'system' and 'user' roles (for backend compatibility)
 */
  public getSystemAndUserMessages(): { role: string; content: string }[] {
    return this.conversationHistorySubject.value
      .filter(entry => entry.role === 'system' || entry.role === 'user')
      .map(entry => ({ role: entry.role, content: entry.content }));
  }

  /**
   * Add an entry to the conversation history
   */
  private addToConversationHistory(role: 'system' | 'user', content: string): void {
    const entry: ConversationEntry = {
      role,
      content: content.trim(),
      timestamp: new Date()
    };

    const currentHistory = this.conversationHistorySubject.value;
    this.conversationHistorySubject.next([...currentHistory, entry]);
  }

  /**
   * Set up speech recognition
   */
  // private setupSpeechRecognition(): Observable<void> {
  //   console.log('[SpeechSDK] setupSpeechRecognition called');
  //   return new Observable<void>(observer => {
  //     try {
  //       if (this.recognizer) {
  //         // console.log('[SpeechSDK] Stopping previous recognizer before setting up new one');
  //         // this.recognizer.stopContinuousRecognitionAsync(
  //         //   () => {
  //         //     this.setupNewRecognizer(observer);
  //         //   },
  //         //   error => {
  //         //     this.ngZone.run(() => {
  //         //       this.handleError('Error stopping previous recognizer', error);
  //         //       observer.error(error);
  //         //     });
  //         //   }
  //         // );
  //       } else {
  //         this.setupNewRecognizer(observer);
  //       }
  //     } catch (error) {
  //       this.ngZone.run(() => {
  //         this.handleError('Error setting up speech recognition', error);
  //         observer.error(error);
  //       });
  //     }
  //   });
  // }


  private setupSpeechRecognition(): Observable<void> {
  console.log('[SpeechSDK] setupSpeechRecognition called');
  return new Observable<void>(observer => {
    try {

        console.log('[SpeechSDK] Attempting to stop previous recognizer...');
        let called = false;

        this.recognizer.stopContinuousRecognitionAsync(
          () => {
            called = true;
            console.log('[SpeechSDK] Previous recognizer stopped');
            this.setupNewRecognizer(observer);
          },
            (error: any) => {
            called = true;
            this.ngZone.run(() => {
              this.handleError('Error stopping previous recognizer', error);
              observer.error(error);
            });
          }
        );

        // ✅ Fallback if callback never fires
        setTimeout(() => {
          if (!called) {
            console.warn('[SpeechSDK] Stop callback did not fire, forcing setupNewRecognizer');
            this.setupNewRecognizer(observer);
          }
        }, 1000);
      
    } catch (error) {
      this.ngZone.run(() => {
        this.handleError('Error setting up speech recognition', error);
        observer.error(error);
      });
    }
  });
}
  /**
   * Helper method to set up a new speech recognizer
   */



  // private setupNewRecognizer(observer: any): void {
  //   // Create the speech recognizer
  //   // const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
  //   // this.recognizer = new speechsdk.SpeechRecognizer(this.speechConfig, audioConfig);

  //   // Set up custom segmentation/connection properties (phrase detection)
  //   try {
  //     console.log(" inside setupNewrecognizer..........");

  //     if (this.recognizer) {
  //       const conn = speechsdk.Connection.fromRecognizer(this.recognizer);
  //       conn.setMessageProperty("speech.context", "phraseDetection", {
  //         INTERACTIVE: {
  //           segmentation: {
  //             mode: "custom",
  //             segmentationSilenceTimeoutMs: 2000
  //           }
  //         },
  //         mode: "Interactive"
  //       });
  //     }
  //   } catch (e) {
  //     console.warn('[SpeechSDK] Could not set custom connection properties:', e);
  //   }

  //   // Set up the event handlers
  //   this.recognizer.recognizing = (s, e) => {
  //     console.log("inside recognizer.recognizing");

  //     // console.log('[SpeechSDK] recognizing event fired');
  //     // console.log(`[SpeechSDK] RECOGNIZING: ${e.result.text}`);
  //   };

  //   this.recognizer.recognized = (s, e) => {
  //     if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech) {
  //       const recognizedText = e.result.text.trim();
  //       console.log("inside recognizer.recognized");
  //       // First check if we should ignore this speech
  //       if (this.isSpeaking || this.isProcessingSubject.value) {
  //         console.log('Ignoring speech: AI is speaking or processing');
  //         return;
  //       }

  //       if (recognizedText.toLowerCase().includes('stop interview')) {
  //         this.ngZone.run(() => {
  //           this.stopInterview().subscribe();
  //         });
  //         return;
  //       }

  //       // If we get here, it's valid user speech that should be processed
  //       this.ngZone.run(() => {
  //         if (recognizedText) {
  //           console.log('Processing user speech:', recognizedText);
  //           // Set processing flag to prevent multiple calls
  //           this.isProcessingSubject.next(true);

  //           // Stop recognition during processing
  //           if (this.recognizer) {
  //             console.log("line number 341...........");

  //             this.recognizer.stopContinuousRecognitionAsync(() => {
  //               console.log("checking the recognizer......");
  //               this.recognizedTextSubject.next(recognizedText);
  //               this.addToConversationHistory('user', recognizedText);
  //               // Only process if we're still not speaking
  //               console.log("isSpeaking.....", this.isSpeaking);

  //               if (!this.isSpeaking) {
  //                 this.processWithLlama().subscribe();
  //               } else {
  //                 this.isProcessingSubject.next(false);
  //                 console.log('Skipped processing: AI started speaking');
  //               }
  //             });
  //           }
  //         }
  //       });
  //     }
  //   };

  //   this.recognizer.canceled = (s, e) => {
  //     // console.log('[SpeechSDK] canceled event fired');
  //     // console.log('[SpeechSDK] CANCELED event:', e);
  //     if (e.reason === speechsdk.CancellationReason.Error) {
  //       this.ngZone.run(() => {
  //         this.handleError(`[SpeechSDK] CANCELED: Error=${e.errorCode} Details=${e.errorDetails}`, new Error(e.errorDetails));
  //       });
  //     } else {
  //       console.log(`[SpeechSDK] CANCELED: Reason=${e.reason}`);
  //     }
  //   };

  //   this.recognizer.sessionStopped = (s, e) => {
  //     // console.log('[SpeechSDK] sessionStopped event fired');
  //     // console.log('[SpeechSDK] Session stopped event:', e);
  //     this.ngZone.run(() => {
  //       this.isListeningSubject.next(false);
  //     });
  //   };

  //   this.recognizer.startContinuousRecognitionAsync(
  //     () => {
  //       this.ngZone.run(() => {
  //         observer.next();
  //         observer.complete();
  //       });
  //     },
  //     error => {
  //       this.ngZone.run(() => {
  //         this.handleError('Error starting speech recognition', error);
  //         observer.error(error);
  //       });
  //     }
  //   );

   
  // }


  private setupNewRecognizer(observer: any): void {
  try {
    console.log("inside setupNewRecognizer..........");

    // Attach event handlers
  this.recognizer.recognizing = (s: any, e: any) => console.log("Recognizing:", e.result?.text);
  this.recognizer.recognized = (s: any, e: any) => console.log("Recognized:", e.result?.text);
//     this.recognizer.recognized = (s, e) => {
//   if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech) {
//     const recognizedText = e.result.text.trim();

//     if (this.isSpeaking || this.isProcessingSubject.value) {
//       console.log('Ignoring speech: AI is speaking or processing');
//       return;
//     }

//     this.ngZone.run(() => {
//       this.isProcessingSubject.next(true);

//       this.recognizer.stopContinuousRecognitionAsync(() => {
//         this.processWithLlama().subscribe();
//       });
//     });
//   }
// };

  this.recognizer.canceled = (s: any, e: any) => console.log("Canceled:", e?.reason);
  this.recognizer.sessionStopped = (s: any, e: any) => this.isListeningSubject.next(false);

    // Start recognition
    this.recognizer.startContinuousRecognitionAsync(
  () => { observer.next(); observer.complete(); },
  (error: any) => { this.handleError('Error starting speech recognition', error); observer.error(error); }
    );
  } catch (e) {
    console.warn('[SpeechSDK] Could not set up recognizer:', e);
  }
}


  /**
   * Process the conversation with LLaMA via Azure OpenAI
   */
  public processWithLlama(): Observable<void> {
    this.isProcessingSubject.next(true);

    // Prepare the conversation history for the API call
    const messages = this.conversationHistorySubject.value.map(entry => ({
      role: entry.role,
      content: entry.content
    }));

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'api-key': this.azureOpenAIKey
    });

    const payload = {
      'messages': messages,
    };

    // Log the payload for debugging
    // console.log('Sending payload to LLM:', JSON.stringify(payload, null, 2));

    // Use Angular's HttpClient (more idiomatic in Angular applications)
    return this.http.post<LlamaResponse>(this.azureOpenAIEndpoint, payload, { headers }).pipe(
      switchMap(responseData => {
        // Log the raw response for debugging
        // console.log('LLM response received:', JSON.stringify(responseData, null, 2));

        // Extract assistant message
        const assistantMessage = responseData.choices[0]?.message?.content?.trim();

        if (assistantMessage) {
          // Add assistant response to conversation history
          this.addToConversationHistory('system', assistantMessage);

          // Convert text to speech
          return this.synthesizeSpeech(assistantMessage);
        }
        return of(undefined);
      }),
      tap(() => {
        this.isProcessingSubject.next(false);
      }),
      catchError((error: any) => {
        this.handleError('Error processing with LLaMA/Azure OpenAI', error);
        this.isProcessingSubject.next(false);
        return of(undefined);
      })
    );
  }

  // Method removed as this logic is now handled in the recognizer's recognized event

  /**
   * Synthesize speech from text using Azure Speech Services
   */
  private async synthesizeSpeech(text: string) {

      this.isSpeaking = true;
      await this._doSynthesis(text);
      console.log("doSynthesis completed");
        //  Start continuous recognition
    // this.recognizer.startContinuousRecognitionAsync();
    this.startInterview();
    
 
  }

  // private _doSynthesis(text: string, observer: any): void {
  //   // Set speaking flags before synthesis starts
  //   this.isSpeaking = true;
  //   this.isProcessingSubject.next(true);
  //   console.log('AI started speaking');

  //   const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
  //   this.synthesizer = new speechsdk.SpeechSynthesizer(this.speechConfig, audioConfig);

  //   // Start synthesis
  //   this.synthesizer.speakTextAsync(
  //     text,
  //     result => {
  //       this.ngZone.run(() => {
  //         if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
  //           // Clear synthesizer first
  //           this.synthesizer = null;

  //           console.log('AI speech synthesis completed');

  //           // Clear speaking flags
  //           this.isSpeaking = false;
  //           this.isProcessingSubject.next(false);

          

  //           observer.next();
  //         } else {
  //           const errorMsg = `Speech synthesis canceled: ${result.errorDetails}`;
  //           this.handleError(errorMsg, new Error(errorMsg));
  //           // Clear speaking flags on error
  //           this.isSpeaking = false;
  //           this.isProcessingSubject.next(false);
  //           observer.error(new Error(errorMsg));
  //         }
  //       });
  //     },
  //     error => {
  //       this.ngZone.run(() => {
  //         this.handleError('Error synthesizing speech', error);
  //         // Clear speaking flags on error
  //         this.isSpeaking = false;
  //         this.isProcessingSubject.next(false);
  //         observer.error(error);
  //       });
  //     }
  //   );
  // }

  private _doSynthesis(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Set speaking flags before synthesis starts
    this.isSpeaking = true;
    this.isProcessingSubject.next(true);
    console.log('AI started speaking');

    const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
    this.synthesizer = new speechsdk.SpeechSynthesizer(this.speechConfig, audioConfig);

    // Start synthesis
    this.synthesizer.speakTextAsync(
      text,
      (result: any) => {
        this.ngZone.run(() => {
          if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
            // Clear synthesizer
            //this.synthesizer = null;
            //Testing ( 05/11/25 --Anmol)
            this.synthesizer?.close()
            console.log('AI speech synthesis completed');

            // Clear speaking flags
            this.isSpeaking = false;
            this.isProcessingSubject.next(false);

            resolve(); // ✅ Resolve when synthesis completes
          } else {
            const errorMsg = `Speech synthesis canceled: ${result.errorDetails}`;
            this.handleError(errorMsg, new Error(errorMsg));
            this.isSpeaking = false;
            this.isProcessingSubject.next(false);
            reject(new Error(errorMsg)); // ✅ Reject on error
          }
        });
      },
      (error: any) => {
        this.ngZone.run(() => {
          this.handleError('Error synthesizing speech', error);
          this.isSpeaking = false;
          this.isProcessingSubject.next(false);
          reject(error); // ✅ Reject on error
        });
      }
    );
  });
}

  /**
   * Handle errors in the service
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.hasErrorSubject.next(message);

    // Reset after 5 seconds
    setTimeout(() => {
      if (this.hasErrorSubject.value === message) {
        this.hasErrorSubject.next(null);
      }
    }, 5000);
  }

  uploadChunks(formData: FormData): Observable<any> {
    const url = `${environment.url3}${Config.UPLOAD_CHUNKS}`;
    return this.http.post<any>(url, formData);
  }
  
  process_video(formData: FormData): Observable<any> {
    const url = `${environment.url4}${Config.PROCESS_VIDEO}`;
    return this.http.post<any>(url, formData);
  }
}