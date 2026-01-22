// ...existing imports and @Component...
// Removed duplicate enterFullscreen methods outside the class
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EndInterviewDialogComponent } from '../dialogs/end-interview-dialog/end-interview-dialog.component';
import { FullscreenWarningDialogComponent } from '../dialogs/fullscreen-warning-dialog.component';
// Use the browser-provided Microsoft Speech SDK if available on window (recommended for Angular browser builds).
// To use this, include the browser bundle script in index.html and expose SpeechSDK on window.
const speechsdk: any = (window as any).SpeechSDK;
import { environment } from '../../components/environment/environment';
import { Config } from '../../components/utils/config';


// Define interfaces for conversation entries
export interface ConversationEntry {
    role: 'system' | 'user' | 'assistant';
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

@Component({
    selector: 'app-started-interview',
    imports: [
        MatIconModule,
        CommonModule,
        MatDialogModule,
        MatSnackBarModule,
        MatMenuModule,
        MatButtonModule,
        MatTooltipModule,
    ],
    templateUrl: './started-interview.component.html',
    styleUrl: './started-interview.component.scss'
})
export class StartedInterviewComponent implements OnInit, OnDestroy, AfterViewInit {
    // ======================
    // PROPERTIES
    // ======================

    @ViewChild('screen', { static: false }) screen!: ElementRef<HTMLVideoElement>;
    @ViewChild('combinedCanvas', { static: false }) combinedCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('webcamVideo', { static: false }) webcamVideo!: ElementRef<HTMLVideoElement>;

    // Face detection and verification
    faceMatcher: any;
    statusMessage = '';
    statusColor = '';
    imageSrc: string = '';
    // Fullscreen tracking
    private fullscreenExitCount = 0;
    private maxFullscreenWarnings = 4; // Show warnings for first 3 exits
    private maxFullscreenExits = 3; // End interview after 3 exits (as per requirement)

    // Candidate and interview data
    candidateName: string = '';
    jobRole: string = '';
    scheduledTime?: Date;
    interviewStatus: string = '';
    isEarlyAccess: boolean = false;
    isLinkExpired: boolean = false;
    id: string = '';

    // Conversation management
    conversationHistory: ConversationEntry[] = [];
    currentSpeaker: 'user' | 'ai' | 'candidate' = 'candidate';

    // Azure Speech SDK configuration (typed as any because SDK types are provided at runtime)
    private speechConfig: any;
    private audioConfig: any;
    private recognizer: any;
    private synthesizer: any = null;

    // Dedicated audio stream for microphone input only
    private microphoneStream: MediaStream | null = null;

    // Azure OpenAI configuration
    private azureOpenAIEndpoint = environment.azureOpenAI.endpoint;
    private azureOpenAIKey = environment.azureOpenAI.key;

    // Recording management
    mediaRecorder!: MediaRecorder;
    recordedVideos: { blob: Blob; filename: string }[] = [];

    // Timing and state management
    interviewDuration = 0;
    recordingDuration = 0;
    private intervalId?: NodeJS.Timeout;
    private recordingIntervalId?: NodeJS.Timeout;
    isInterviewActive = false;
    isRecording = false;

    // UI state properties to match HTML template
    screenSharingAllowed = false;
    isVideoOn = true;
    isMuted = false;
    interviewEnded = false;

    // State tracking with simplified boolean approach - derive from actual objects
    private recognizerState: 'idle' | 'active' = 'idle';
    private currentApiCall: Promise<any> | null = null;
    private isAISpeaking: boolean = false; // Additional flag to block all speech processing
    private stopClicked: boolean = false; // Flag to track if interview should stop
    private recognitionStarted: boolean = false; // Flag to track recognition timing
    private currentUtterance: string = ""; // Current user speech being built

    // Getters - derive state from actual objects instead of boolean flags
    get isFullscreen(): boolean {
        return !!document.fullscreenElement;
    }

    get hasRecordings(): boolean {
        return this.recordedVideos.length > 0;
    }

    get isSpeaking(): boolean {
        return this.synthesizer !== null;
    }

    get isListening(): boolean {
        return this.recognizerState === 'active';
    }

    get isProcessing(): boolean {
        return this.currentApiCall !== null;
    }

    get formattedDuration(): string {
        const minutes = Math.floor(this.interviewDuration / 60);
        const seconds = this.interviewDuration % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    get formattedRecordingDuration(): string {
        const minutes = Math.floor(this.recordingDuration / 60);
        const seconds = this.recordingDuration % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Services
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private http: HttpClient,
        // private ngZone: NgZone,
        private cdr: ChangeDetectorRef
    ) {
        // Initialize Azure Speech SDK
        this.speechConfig = speechsdk.SpeechConfig.fromSubscription(
            environment.azureSpeech.subscriptionKey,
            environment.azureSpeech.region
        );
        this.speechConfig.speechRecognitionLanguage = environment.azureSpeech.recognitionLanguage;
        this.speechConfig.speechSynthesisVoiceName = environment.azureSpeech.voiceName;

        // Configure audio with echo cancellation
        this.audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();

        // Enable echo cancellation and noise suppression
        this.speechConfig.setProperty(
            speechsdk.PropertyId.SpeechServiceConnection_EnableAudioLogging,
            "false"
        );

        // Configure for input-only mode to prevent audio feedback
        this.speechConfig.setProperty(
            speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
            "30000"
        );
        this.speechConfig.setProperty(
            speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
            "3000"
        );
    }

    // ======================
    // LIFECYCLE METHODS
    // ======================

    async ngOnInit(): Promise<void> {
        this.route.params.subscribe(async params => {
            this.id = params['id'];
            if (this.id) {
                // this.statusMessage = 'Face verification disabled - Interview ready to start';
                this.statusColor = 'green';
            } else {
                // this.statusMessage = 'Interview ID is missing. Cannot load candidate image.';
            }

            // Get candidate details - direct API call
            await this.getCandidateDetailsFromApi(this.id);
        });

        // Monitor fullscreen changes
        document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    }

    async ngAfterViewInit(): Promise<void> {
        await this.setupCamera();
        await this.setupScreenShare();
        // Setup microphone-only stream is now called within setupSpeechRecognition
        await this.setupSpeechRecognition();
        // Set screen sharing as allowed once setup is complete
        this.screenSharingAllowed = true;
        // Add a small delay to ensure video elements are fully ready
        await this.sleep(1000);
        // Start the interview automatically once everything is set up
        await this.startInterview();
    }

    ngOnDestroy(): void {
        this.cleanup();
        document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    }

    // ======================
    // CAMERA AND SCREEN SETUP
    // ======================

        private cameraStream!: MediaStream;
    private async setupCamera(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                    sampleSize: 16,
                    channelCount: 1
                }
            });
             // Store the stream in a class property
            this.cameraStream = stream;
            // Use webcamVideo for the visible video element in template
            if (this.webcamVideo?.nativeElement) {
                this.webcamVideo.nativeElement.srcObject = stream;
                // Disable audio playback to prevent echo - mute the video element
                this.webcamVideo.nativeElement.muted = true;
                this.webcamVideo.nativeElement.volume = 0;
                await this.webcamVideo.nativeElement.play();
               
            } else {
                console.error('WebcamVideo element not found!');
            }
        } catch (error) {
            this.showError('Camera access denied. Please allow camera access and refresh.');
        }
    }

    private async setupScreenShare(): Promise<void> {   
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            // if (this.screen?.nativeElement) {
            //     this.screen.nativeElement.srcObject = stream;
            //     await this.screen.nativeElement.play();
            // } else {
            //     console.error('Screen element not found!');
            // }
        } catch (error) {
            console.error('Error accessing screen share:', error);
            this.showError('Screen share access denied. Please allow screen access.');
        }
    }

    // ======================
    // SPEECH RECOGNITION METHODS
    // ======================

    private async setupMicrophoneOnlyStream(): Promise<void> {
        try {
            console.log('🎤 Setting up dedicated microphone-only stream...');

            // Create audio-only stream with optimized settings for speech recognition
            this.microphoneStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                    sampleSize: 16,
                    channelCount: 1,
                    // Additional constraints for microphone-only input
                    latency: 0.01, // Low latency for real-time processing
                    googEchoCancellation: true,
                    googAutoGainControl: true,
                    googNoiseSuppression: true
                } as any,
                video: false // No video for this stream - audio only
            });
            // Configure Azure Speech SDK to use this dedicated audio stream
            if (this.microphoneStream.getAudioTracks().length > 0) {
                // Create audio config from the dedicated microphone stream
                const audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(this.microphoneStream);

                // Use the dedicated stream for speech recognition
                this.audioConfig = speechsdk.AudioConfig.fromStreamInput(this.microphoneStream);
            }

        } catch (error) {

            // Fallback to default microphone if dedicated setup fails
            this.audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        }
    }

    private async setupSpeechRecognition(): Promise<void> {
        // First set up the dedicated microphone-only stream
        await this.setupMicrophoneOnlyStream();

        this.recognizer = new speechsdk.SpeechRecognizer(this.speechConfig, this.audioConfig);

        // Configure recognition timeout
        this.recognizer.properties.setProperty(
            speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
            "30000"
        );
        this.recognizer.properties.setProperty(
            speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
            "3000"
        );

        // Event handlers
            this.recognizer.recognizing = (s: any, e: any) => {
            if (!this.recognitionStarted) {
                this.recognitionStarted = true;
                // console.log('Recognition started');
            }
            // console.log(`RECOGNIZING: Text=${e.result.text}`);
        };

        this.recognizer.recognized = async (s: any, e: any) => {
            if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech && e.result.text.trim()) {
                console.log(`🎤 RECOGNIZED: Text=${e.result.text}`);

                // CRITICAL GUARD: If AI is speaking, COMPLETELY IGNORE
                if (this.isAISpeaking || this.stopClicked) {
                    // console.log('BLOCKED: AI speaking or interview stopped');
                    return;
                }

                // Check if user wants to end interview
                const recognizedText = e.result.text.toLowerCase();
                if (recognizedText.includes('end interview') || recognizedText.includes('end the interview')) {
                    console.log('🔚 User said "end interview" - showing confirmation dialog');

                    // Stop recognition immediately
                    await this.stopContinuousRecognition();

                    // Show confirmation dialog first
                    this.confirmEndInterview();
                    return;
                }

                // Stop recognition immediately after getting result (matches original JS)
                await this.stopContinuousRecognition();

                // Build the current utterance (matches original JS pattern)
                this.currentUtterance += e.result.text;
                console.log('Current utterance:', this.currentUtterance);

                // Add to conversation history and process with AI
                this.addToConversationHistory('user', this.currentUtterance);

                // Reset for next utterance
                this.currentUtterance = "";
                this.recognitionStarted = false;

                // Set current speaker to candidate when they speak
                this.currentSpeaker = 'candidate';

                // Update UI - User speaking (matches original JS)
                if (document.getElementById('webcam')) {
                    document.getElementById('webcam')!.style.border = "thick solid #00FF00";
                }
                if (document.getElementById('ai_interviewer')) {
                    document.getElementById('ai_interviewer')!.style.border = "none";
                }

                // Process with AI (this will handle the full flow)
                await this.processWithLlama();
            }
        };

        this.recognizer.canceled = (s: any, e: any) => {
            console.log(`CANCELED: Reason=${e.reason}`);
            if (e.reason === speechsdk.CancellationReason.Error) {
                console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
            }
        };

        this.recognizer.sessionStopped = (s: any, e: any) => {
            console.log('[SpeechSDK] Session stopped event:', e);
            this.recognizerState = 'idle';
        };

        // DON'T start recognition here - it will be started after AI's first greeting
        console.log('Speech recognizer setup complete, but not started yet');
    }

    private async startContinuousRecognition(): Promise<void> {
        // Safety check: don't start if already active
        if (this.recognizerState === 'active') {
            console.log('Recognition already active, skipping start');
            return;
        }

        return new Promise((resolve, reject) => {
            this.recognizer.startContinuousRecognitionAsync(
                () => {
                    this.recognizerState = 'active';
                    console.log(' Speech recognition started successfully');
                    resolve();
                },
                (error: any) => {
                    console.error(' Error starting speech recognition:', error);
                    this.recognizerState = 'idle';
                    reject(error);
                }
            );
        });
    }

    private async stopContinuousRecognition(): Promise<void> {
        // Safety check: don't stop if already idle
        if (this.recognizerState === 'idle') {
            console.log('Recognition already idle, skipping stop');
            return;
        }

        return new Promise((resolve, reject) => {
            this.recognizer.stopContinuousRecognitionAsync(
                () => {
                    this.recognizerState = 'idle';
                    console.log('Speech recognition stopped successfully');
                    resolve();
                },
                (error: any) => {
                    console.error(' Error stopping speech recognition:', error);
                    // Force state to idle even on error
                    this.recognizerState = 'idle';
                    reject(error);
                }
            );
        });
    }

    // ======================
    // LLAMA PROCESSING METHODS
    // ======================

    private async processWithLlama(): Promise<void> {
        // GUARD: Prevent multiple simultaneous API calls
        if (this.currentApiCall !== null) {
            return;
        }

        // GUARD: Don't process if AI is currently speaking
        if (this.synthesizer !== null) {
            return;
        }

        this.currentSpeaker = 'ai';

        try {
            // Prepare the conversation history for the API call
            const messages = this.conversationHistory.map(entry => ({
                role: entry.role,
                content: entry.content
            }));

            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                // 'api-key': this.azureOpenAIKey
            });

            const payload = {
                'messages': messages
            };
            // Create and track the API call - this sets isProcessing to true

            const apiCall = this.makeHttpRequest(headers, payload);
            this.currentApiCall = apiCall;
            const response = await apiCall;


            if (response) {
                // console.log('LLM response received:', JSON.stringify(response, null, 2));

                const assistantMessage = response.choices[0]?.message?.content?.trim();

                if (assistantMessage) {
                    // Add assistant response to conversation history
                    // this.addToConversationHistory('system', assistantMessage);
                    this.addToConversationHistory('assistant', assistantMessage);

                    // Check for interview end phrases - AI naturally concluded interview
                    if (assistantMessage.toLowerCase().includes('will be in touch with you regarding the outcome')) {
                        console.log('🔚 AI naturally concluded interview with outcome phrase - will end after speaking');
                        this.stopClicked = true; // Prevent recognition restart

                        // Convert text to speech FIRST, then end after speaking
                        await this.synthesizeSpeech(assistantMessage);

                        this.snackBar.open('Interview completed successfully', 'OK', { duration: 3000 });

                        // End interview after AI has spoken
                        await this.performEndInterview();
                        return;
                    }

                    // Convert text to speech (this will handle UI updates and recognition restart)
                    await this.synthesizeSpeech(assistantMessage);

                    // Check if we should end after AI spoke (user confirmed end interview via dialog)
                    if (this.stopClicked) {
                        await this.performEndInterview();
                        return;
                    }
                }
            }

        } catch (error) {
            console.error(' Error processing with LLaMA/Azure OpenAI:', error);
            console.error(' Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace',
                currentApiCall: !!this.currentApiCall,
                conversationLength: this.conversationHistory.length
            });

            // Show user-friendly error
            this.snackBar.open('Error communicating with AI. Please try again.', 'OK', { duration: 5000 });
        } finally {
            // Clear the API call - this sets isProcessing to false
            this.currentApiCall = null;
            // console.log('LLaMA processing completed');
        }
    }

    private async makeHttpRequest(headers: HttpHeaders, payload: any): Promise<any> {
        // Retry logic
        let response: any = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!response && attempts < maxAttempts) {
            attempts++;
            if (attempts > 1) {
                await this.sleep(3000);
            }

            try {
                const httpResponse = await this.http.post<LlamaResponse>(this.azureOpenAIEndpoint, payload, { headers }).toPromise();
                response = httpResponse;
            } catch (error) {
                if (attempts === maxAttempts) {
                    throw error;
                }
            }
        }

        return response;
    }

    // ======================
    // SPEECH SYNTHESIS METHODS
    // ======================

    private async synthesizeSpeech(text: string): Promise<void> {
        this.currentSpeaker = 'ai';

        try {
            // SET AI SPEAKING FLAG IMMEDIATELY to block all speech processing
            this.isAISpeaking = true;
            // Reduce system audio volume to prevent echo
            this.setAudioOutputVolume(0.3); // 30% volume
            // Update UI - AI speaking indicator (matches original JS exactly)
            if (document.getElementById('ai_interviewer')) {
                document.getElementById('ai_interviewer')!.style.border = "thick solid #00FF00";
            }
            if (document.getElementById('webcam')) {
                document.getElementById('webcam')!.style.border = "none";
            }
            // AI speaks - this should NOT be interrupted
            await this.doSynthesis(text);
            // Update UI - Remove AI speaking indicator, add candidate listening indicator (matches original JS)
            if (document.getElementById('ai_interviewer')) {
                document.getElementById('ai_interviewer')!.style.border = "none";
            }
            if (document.getElementById('webcam')) {
                document.getElementById('webcam')!.style.border = "thick solid #00FF00";
            }

            // CLEAR AI SPEAKING FLAG BEFORE restarting recognition
            this.isAISpeaking = false;
            // Restore normal audio volume after AI finishes
            this.setAudioOutputVolume(0.8); // 80% volume

            // ONLY restart recognition if interview is still active and not stopped (matches original JS stopClicked check)
            if (this.isInterviewActive && !this.stopClicked && this.recognizerState === 'idle') {
                // console.log('Restarting speech recognition after AI finished speaking');
                this.recognitionStarted = false; // Reset recognition state (matches original JS)
                await this.startContinuousRecognition();
            } else {
                // console.log(`NOT restarting recognition: isInterviewActive=${this.isInterviewActive}, stopClicked=${this.stopClicked}, recognizerState=${this.recognizerState}`);
            }
        } catch (error) {
            console.error('Error in speech synthesis:', error);
            // ALWAYS clear the AI speaking flag on error
            this.isAISpeaking = false;
            // console.log('AI SPEAKING FLAG CLEARED due to error');

            // Restore audio volume on error too
            this.setAudioOutputVolume(0.8);

            // If there's an error, ensure recognition is in proper state
            if (this.isInterviewActive && !this.stopClicked && this.recognizerState === 'idle') {
                await this.startContinuousRecognition();
            }
        } finally {
            // Clear synthesizer - this sets isSpeaking to false
            this.synthesizer = null;
            // Ensure AI speaking flag is cleared
            this.isAISpeaking = false;
        }
    }

    private async doSynthesis(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create synthesizer with audio output configuration
            this.synthesizer = new speechsdk.SpeechSynthesizer(this.speechConfig);

            // Set audio format to reduce echo
            this.speechConfig.setProperty(
                speechsdk.PropertyId.SpeechServiceConnection_SynthOutputFormat,
                "audio-16khz-32kbitrate-mono-mp3"
            );

            this.synthesizer.speakTextAsync(
                text,
                (result: any) => {
                    if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
                        // CRITICAL: Use exact timing from original JS - privAudioDuration/10000 - 1000
                        const audioDurationMs = (result.audioDuration / 10000) - 1000;
                        console.log(` Waiting ${audioDurationMs}ms for audio to finish playing (matching original JS timing)...`);

                        setTimeout(() => {
                            console.log("Audio playback duration completed - synthesis truly finished");
                            resolve();
                        }, Math.max(audioDurationMs, 0)); // Ensure non-negative timeout

                    } else {
                        console.error("Speech synthesis failed:", result.errorDetails);
                        reject(new Error(result.errorDetails));
                    }
                    this.synthesizer?.close();
                },
                (error: any) => {
                    console.error(" Speech synthesis error:", error);
                    this.synthesizer?.close();
                    reject(error);
                }
            );
        });
    }

    // ======================
    // CONVERSATION MANAGEMENT
    // ======================

    private setSystemAndUserHistory(systemPrompt: string, userMessage: string): void {
        this.conversationHistory = [
            { role: 'system', content: systemPrompt, timestamp: new Date() },
            { role: 'user', content: userMessage, timestamp: new Date() }
        ];
    }

    // private addToConversationHistory(role: 'system' | 'user', content: string): void {
    private addToConversationHistory(role: 'system' | 'user' | 'assistant', content: string): void {
        const entry: ConversationEntry = {
            role,
            content,
            timestamp: new Date()
        };
        this.conversationHistory.push(entry);
    }

    // ======================
    // API METHODS
    // ======================

    private async getCandidateDetailsFromApi(interviewId: string): Promise<void> {
        try {
            const url = `${environment.url1}${Config.GET_INTERVIEW_DETAILS}`;
            const headers = new HttpHeaders({
                'Content-Type': 'application/json'
            });

            const response = await this.http.post<any>(url, { id: interviewId }, { headers }).toPromise();

            if (response) {
                this.candidateName = response.candidate_name;
                this.jobRole = response.job_role;
                this.scheduledTime = new Date(response.scheduled_utc_time);
                this.interviewStatus = response.interview_status;
                this.isEarlyAccess = response.isEarlyAccess;
                this.isLinkExpired = response.isLinkExpired;

                // Set conversation history
                if (response.system_prompt) {
                    this.setSystemAndUserHistory(response.system_prompt, 'Hello');
                }
            }
        } catch (error) {
            console.error('Error fetching candidate details:', error);
            this.showError('Failed to load candidate details');
        }
    }
    // ======================
    // RECORDING METHODS
    // ======================

    // Counter for chunk uploads (matches original component)
    private counter = 0;
     async startRecording(): Promise<void> {
        try {
            if (this.isRecording) {
                return;
            }
            if (!this.cameraStream) {
                throw new Error('Camera stream not initialized');
            }
            const stream = this.cameraStream; // Use the stored stream
            const videoTracks = stream.getVideoTracks();
            if (!videoTracks.length || !stream.active) {
                throw new Error('No active video tracks found in MediaStream');
            }
            this.isRecording = true;
            this.recordingDuration = 0;
            let mediaRecorder: MediaRecorder;
            let chunks: Blob[] = [];
            const startAutoRecording = () => {
                 console.log('Starting new recording chunk...');
                chunks = [];
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                   console.log('ondataavailable called');
                mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                mediaRecorder.onstop = () => {
                        console.log('onstop called');
                    const blob = new Blob(chunks, { type: 'video/webm' });
                       (window as any).lastRecordedBlob = blob;
                          console.log('Chunk recorded and assigned to window.lastRecordedBlob');
                    chunks = [];
                    this.uploadChunk(blob);
                    // If still recording, start next chunk
                    if (this.isRecording) {
                        setTimeout(() => startAutoRecording(), 100);
                    }
                       // TEST: Download the chunk directly
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'test.webm';
    // a.click();
                };
                mediaRecorder.start();
                  console.log('mediaRecorder started');
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                            console.log('Calling mediaRecorder.stop()');
                        mediaRecorder.stop();
                    }
                }, 3000);
            };
            startAutoRecording();
            // Start recording timer
            this.recordingIntervalId = setInterval(() => {
                this.recordingDuration++;
            }, 1000);
        } catch (error) {
            this.isRecording = false;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Failed to start recording: ${errorMessage}`);
        }
    }


    private uploadChunk(chunk: Blob): void {
        const blob = chunk;
        const formData = new FormData();
        formData.append('file', blob, 'chunk.webm');
        formData.append('id', this.id || '');
        formData.append('counter', String(this.counter));
        this.counter++;
        const uploadUrl = `${environment.url3}${Config.UPLOAD_CHUNKS}`;
        const processUrl = `${environment.url4}${Config.PROCESS_VIDEO}`;
        

        this.http.post(processUrl, formData).subscribe({  
            next: (response) => {  
                console.log('Upload successful', response);  
            },  
            error: (error) => {  
                console.error('Upload error', error);  
            }  
            });  
            
        this.http.post<any>(uploadUrl, formData).subscribe({
            next: (response) => {
                // console.log("response....", response);
                // Update status message and color based on response.status
                if (response.status === "verified") {
                    this.statusMessage = `Face verified`;
                    this.statusColor = "green";

                } else if (response.status === "multiple_faces") {
                    this.statusMessage = "Multiple Faces Detected!";
                    this.statusColor = "#ff5555";
                } else if (response.status === "no_face_detected") {
                    this.statusMessage = "No Face Detected!";
                    this.statusColor = "#ff5555";
                } else if (response.status === "decode_failed") {
                    this.statusMessage = response.reason;
                    this.statusColor = "#ff5555";
                } else {
                    this.statusMessage = `Face is Not Matching `;
                    this.statusColor = "#ff5555";
                }
            },
            error: (error) => {
                console.error(`Error uploading chunk ${this.counter - 1}:`, error);
                // this.statusMessage = "Error contacting server.";
                // this.statusColor = "#ff5555";
            }
        });
    }


    stopRecording(): void {
        if (this.isRecording) {
            this.isRecording = false;
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
            clearInterval(this.recordingIntervalId);
        }
    }

    // ======================
    // INTERVIEW CONTROL METHODS
    // ======================

    private showEndInterviewConfirmation(): void {
        const dialogRef = this.dialog.open(EndInterviewDialogComponent);

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result === true) { // Dialog returns true when user clicks "End Interview"
                // Set stop flag to prevent new recognition cycles after AI response
                this.stopClicked = true;
                this.isAISpeaking = false;
                this.addToConversationHistory('user', 'End the Interview');
                try {
                    await this.processWithLlama();

                } catch (error) {
                    await this.performEndInterview();
                }
            } else {

                // User cancelled - restart speech recognition if interview is still active
                if (this.isInterviewActive && !this.stopClicked && this.recognizerState === 'idle') {
                    await this.startContinuousRecognition();
                }
            }
        });
    }

    private async startConversationWithAI(): Promise<void> {
        try {
            // Give a moment for everything to settle
            await this.sleep(2000);
            // Check if we have conversation history with system prompt
            if (this.conversationHistory.length === 0) {
                console.warn('No conversation history found, AI may not have proper context');
            }
            // Process with AI to get the initial greeting (AI starts the conversation)
            await this.processWithLlama();

        } catch (error) {
            console.error('Error starting conversation with AI:', error);
        }
    }

    async startInterview(): Promise<void> {
        try {
            // Force fullscreen
            await this.enterFullscreenAsync();
            this.isInterviewActive = true;
            // Reset interview state flags (matches original JS)
            this.stopClicked = false;
            this.recognitionStarted = false;
            this.currentUtterance = "";
            this.fullscreenExitCount = 0;
            this.statusMessage = 'Interview active - Face verification enabled';
            this.statusColor = 'green';

            // Start interview timer
            this.intervalId = setInterval(() => {
                this.interviewDuration++;
            }, 1000);
            this.snackBar.open('Interview started. Speak when ready.', 'OK', { duration: 3000 });
            // Automatically start recording as soon as interview starts (matches original component behavior)
            await this.startRecording();
            // Start the conversation with AI greeting
            await this.startConversationWithAI();

        } catch (error) {
            console.error('Error starting interview:', error);
            this.showError('Failed to start interview');
        }
    }

    private async performEndInterview(): Promise<void> {

        try {
            // Set stop flag first (matches original JS stopClicked = true)
            this.stopClicked = true;
            this.isInterviewActive = false;
            this.interviewEnded = true;
            // Stop speech recognition if active (matches original JS)
            if (this.recognizerState === 'active') {
                await this.stopContinuousRecognition();
            }

            // Stop recording
            this.stopRecording();

            // Stop timers
            if (this.intervalId) {
                console.log('Stopping interview timer...');
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }

            // Stop recording timer
            if (this.recordingIntervalId) {
              
                clearInterval(this.recordingIntervalId);
                this.recordingIntervalId = undefined;
            }
            this.cleanup();
            try {
                const messages = this.conversationHistory.map(({ role, content }) => ({ role, content }));
                const interview_id = this.id || '';
                const payload = { interview_id, messages };
                const url = `${environment.url1}${Config.CHAT_TRANSCRIPT}`;

                this.http.post<any>(url, payload).subscribe({
                    next: (data) => {
                       
                    },
                    error: (err) => {
                    }
                });
            } catch (transcriptError) {
                console.error(' Error preparing transcript:', transcriptError);
            }

            
            this.snackBar.open('Thank you for attending this interview. You can now close the browser.', 'OK', { duration: 5000 });

            // Force change detection to ensure overlay shows
            this.cdr.detectChanges();
            setTimeout(() => {
                // this.router.navigate(['/dashboard']);
            }, 5000); 

        } catch (error) {
            console.error(' Error in performEndInterview:', error);
            // Even if there's an error, ensure we end the interview
            this.stopClicked = true;
            this.isInterviewActive = false;
            this.interviewEnded = true;
            this.cdr.detectChanges();
            this.snackBar.open('Interview ended (with errors)', 'OK', { duration: 3000 });

            setTimeout(() => {
                this.router.navigate(['/dashboard']);
            }, 3000);
        }
    }

    // ======================
    // FULLSCREEN MANAGEMENT
    // ======================

    // Public method for template to call when user clicks "Re-enter full screen"
    enterFullscreen(): void {
        try {
            if (document.documentElement.requestFullscreen) {
             
                document.documentElement.requestFullscreen();
            } else {
                console.warn(' Fullscreen API not supported');
                this.showError('Fullscreen mode is not supported in this browser');
            }
        } catch (error) {
            console.error(' Error entering fullscreen:', error);
            this.showFullscreenWarning();
        }
    }

    // UI flow: handle Enter Fullscreen & Start button (matches original component)
    async onEnterFullscreenAndStartInterview(): Promise<void> {
        await this.enterFullscreenAsync();
    }

    // Private method for internal use during interview start
    private async enterFullscreenAsync(): Promise<void> {
        try {
            await document.documentElement.requestFullscreen();
        } catch (error) {
            this.showFullscreenWarning();
        }
    }

    private showFullscreenWarning(): void {
        this.fullscreenExitCount++;
        if (this.fullscreenExitCount >= this.maxFullscreenExits) {
            this.snackBar.open('Interview ended due to repeated fullscreen exits.', 'OK', { duration: 4000 });
            this.performEndInterview();
            return;
        }

        if (this.fullscreenExitCount <= this.maxFullscreenWarnings) {
            const dialogRef = this.dialog.open(FullscreenWarningDialogComponent, {
                width: '400px',
                data: {
                    exitCount: this.fullscreenExitCount,
                    fullscreenElementSelector: 'html'
                },
                disableClose: true
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result === 'end') {
                    this.performEndInterview(); // Direct end without extra dialog
                } else if (result === 'reenter') {
                }
            });
        }
    }

    private onFullscreenChange(): void {
        if (!document.fullscreenElement && this.isInterviewActive) {
            this.showFullscreenWarning();
        }
    }

    // ======================
    // UTILITY METHODS
    // ======================

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });
    }

    private cleanup(): void {
        // Clean up speech services
        if (this.recognizer) {
            this.recognizer.close();
        }
        if (this.synthesizer) {
            this.synthesizer.close();
            this.synthesizer = null;
        }

        // Clean up dedicated microphone stream
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => {
                track.stop();
               
            });
            this.microphoneStream = null;
        }

        // Clear API call - this sets isProcessing to false
        this.currentApiCall = null;
        // Reset state - this sets isListening to false
        this.recognizerState = 'idle';
    }

    // ======================
    // UI CONTROL METHODS
    // ======================

    toggleMute(): void {
        this.isMuted = !this.isMuted;
        // Add actual mute functionality if needed
    
    }

    toggleVideo(): void {
        this.isVideoOn = !this.isVideoOn;

        if (this.webcamVideo?.nativeElement) {
            if (this.isVideoOn) {
                this.webcamVideo.nativeElement.style.display = 'block';
            } else {
                this.webcamVideo.nativeElement.style.display = 'none';
            }
        }
    }

    toggleRecording(): void {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    // Method to control audio output volume
    private setAudioOutputVolume(volume: number): void {
        // Get all audio elements and set volume (0.0 to 1.0)
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.volume = Math.max(0, Math.min(1, volume));
        });
    }
    // ======================
    // PUBLIC TEMPLATE METHODS
    // ======================

    // Main entry point for ending interview - can be called from UI
    confirmEndInterview(): void {
        this.showEndInterviewConfirmation();
    }

    showFullscreenModal(): void {
        // Method for template compatibility - shows snackbar message
        this.snackBar.open('Please switch to fullscreen for the interview.', 'OK', { duration: 4000 });
    }
}