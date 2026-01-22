# AI Interview Service for Angular

This service provides a complete speech-driven AI interview experience using:
- Speech-to-Text (Azure Cognitive Services)
- LLaMA integration (via Azure OpenAI)
- Text-to-Speech (Azure Cognitive Services)

## Features

- **Speech-to-Text (STT)**
  - Real-time microphone input capture
  - Continuous speech recognition
  - Conversion to text with Azure Cognitive Services

- **LLaMA Integration**
  - Sends conversation history to LLaMA model via Azure OpenAI
  - Manages API communication with proper headers and authentication
  - Processes AI responses

- **Text-to-Speech (TTS)**
  - Converts AI responses to natural-sounding speech
  - Automatic playback through the browser
  - Configurable voice selection

- **Conversation Management**
  - Maintains complete conversation history
  - Provides RxJS observables for reactive UI updates
  - Supports starting/stopping interviews

## Setup Instructions

### 1. Install Required Packages

```bash
npm install microsoft-cognitiveservices-speech-sdk rxjs
```

### 2. Configure Environment Variables

Update your environment file with the necessary Azure credentials:

```typescript
// src/app/components/environment/environment.ts
export const environment = {
  // Preserve existing settings
  url1: 'https://10.179.82.226:8443',
  url2: 'https://10.179.4.9:8067/api/v1',
  
  // Azure Speech Service configuration
  azureSpeech: {
    subscriptionKey: 'your-speech-key',
    region: 'your-region',
    recognitionLanguage: 'en-US',
    voiceName: 'en-US-JennyNeural'
  },
  azureOpenAI: {
    endpoint: 'your-azure-openai-endpoint',
    key: 'your-openai-key',
    model: 'your-model-deployment-name',
  }
};
```

### 3. Import the Service in Your App Module

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AiInterviewService } from './services/ai-interview.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule // Required for API calls
  ],
  providers: [AiInterviewService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Usage Examples

### Basic Usage in a Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AiInterviewService } from './services/ai-interview.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interview',
  template: `
    <div>
      <button (click)="startInterview()" [disabled]="isListening">Start Interview</button>
      <button (click)="stopInterview()" [disabled]="!isListening">Stop Interview</button>
      
      <div *ngFor="let entry of conversation">
        <strong>{{ entry.role === 'user' ? 'You' : 'AI' }}:</strong> {{ entry.content }}
      </div>
    </div>
  `
})
export class InterviewComponent implements OnInit, OnDestroy {
  conversation = [];
  isListening = false;
  private subscriptions = new Subscription();
  
  constructor(private aiService: AiInterviewService) {}
  
  ngOnInit(): void {
    this.subscriptions.add(
      this.aiService.conversationHistory$.subscribe(history => {
        this.conversation = history.filter(entry => entry.role !== 'system');
      })
    );
    
    this.subscriptions.add(
      this.aiService.isListening$.subscribe(listening => {
        this.isListening = listening;
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.isListening) {
      this.aiService.stopInterview().subscribe();
    }
  }
  
  startInterview(): void {
    this.aiService.startInterview().subscribe();
  }
  
  stopInterview(): void {
    this.aiService.stopInterview().subscribe();
  }
}
```

### Advanced Usage

For more advanced usage, including error handling and UI feedback, see the InterviewSessionComponent provided with this service.

## Key Methods

- `startInterview()`: Starts the interview session and begins listening
- `stopInterview()`: Stops the interview and cleans up resources
- `getConversationHistory()`: Returns the current conversation history
- `clearConversationHistory()`: Clears the conversation history

## Observables

- `conversationHistory$`: Stream of conversation history updates
- `recognizedText$`: Stream of recognized text as it happens
- `isListening$`: Boolean indicating if the service is currently listening
- `isProcessing$`: Boolean indicating if the service is processing with AI
- `hasError$`: Error messages, if any

## Special Features

- Say "stop interview" during the session to automatically end it
- System prompts are preserved when clearing conversation history
- Automatic error recovery and resource cleanup

## Notes for Production

- Secure your API keys using proper environment variable management
- Consider implementing rate limiting for API calls
- Test thoroughly across different browsers for speech recognition compatibility
