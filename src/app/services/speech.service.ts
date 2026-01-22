// import { Injectable } from '@angular/core';
// import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

// @Injectable({
//   providedIn: 'root'
// })
// export class SpeechService {
//   // private speechConfig: speechsdk.SpeechConfig;

//   // constructor() {
//   //   this.speechConfig = speechsdk.SpeechConfig.fromSubscription(
//   //     // environment.azureSpeech.subscriptionKey,
//   //     // environment.azureSpeech.region
//   //   );
//   //   this.speechConfig.speechRecognitionLanguage = 'en-IN';
//   //   this.speechConfig.speechSynthesisVoiceName = 'en-IN-NeerjaNeural'; // choose your voice
//   // }

//   // 🎙️ Convert speech → text (one-time listen)
//   startRecognition(): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
//       const recognizer = new speechsdk.SpeechRecognizer(this.speechConfig, audioConfig);

//       recognizer.recognizeOnceAsync(
//         result => {
//           recognizer.close();
//           resolve(result.text || '');
//         },
//         err => {
//           recognizer.close();
//           reject(err);
//         }
//       );
//     });
//   }

//   // 🗣️ Convert text → speech
//   // speakText(text: string, onComplete: () => void) {
//   //   const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
//   //   const synthesizer = new speechsdk.SpeechSynthesizer(this.speechConfig, audioConfig);

//   //   synthesizer.speakTextAsync(
//   //     text,
//   //     result => {
//   //       synthesizer.close();

//   //       onComplete();
//   //     },
//   //     error => {
//   //       console.error('Speech synthesis error:', error);
//   //       synthesizer.close();
//   //       onComplete();
//   //     }
//   //   );
//   // }

//   speakText(text: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//      const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
//     // const synthesizer = new speechsdk.SpeechSynthesizer(this.speechConfig, audioConfig);
//       synthesizer.speakTextAsync(text,
//         result => {
//           synthesizer.close();
//           resolve("completed");
//         },
//         error => {
//           synthesizer.close();
//           reject(error);
//         }
//       );
//     });
//   }
// }

