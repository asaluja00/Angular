// import { Component, OnInit } from '@angular/core';
// import { SpeechService } from '../../app/services/speech.service';
// import { InterviewApiService } from '../../app/services/interview-api.service';

// @Component({
//   selector: 'app-main-interview-session',
//   templateUrl: './main-interview-session.component.html',
//   styleUrls: ['./main-interview-session.component.scss']
// })
// export class MainInterviewSessionComponent implements OnInit {
//   messages: { role: string, content: string }[] = [];
//   isSpeaking = false;
//   isListening = false;

//   constructor(
//     private speechService: SpeechService,
//     private apiService: InterviewApiService
//   ) {}

//   ngOnInit() {
//     this.initializeInterview();
//   }

//   private initializeInterview() {
//     const systemPrompt = `
//       "\n\n    ###CONTEXT###\n    You are a very fastidious and to the point interviewer with good experience as a Software Engineer. You are conducting an oral interview.\n    Today, you are interviewing a candidate for a Software Engineer position.\n    The job description highlights the following vital topics: python,sql,communication.\n    Additionally, it mentions some good-to-know topics: python certifications.\n    Key information extracted from the candidate's resume is provided below:\n\n    Candidate Name: YASHITA BANSAL\n    Relevant Work Experience: [{'company': '', 'duration': '', 'responsibilities': ''}]\n    Technical Skills: ['COMPETITIVE PROGRAMMING', 'PYTHON', 'C++', 'HTML/CSS', 'Javascript', 'SQL', 'NextJS', 'TAILWIND CSS', 'REACT', 'GIT', 'DBMS', 'OOPS', 'MACHINE LEARNING']\n    Project Titles: ['CDGC WEBSITE', 'MEDICARE', 'DEVINSIGHT']\n\n    ###INSTRUCTIONS###    \n    Conduct a to the point interview with the candidate, focusing on the job requirements. Ask 2-3 questions about each and every vital topic, each and every good-to-know topic, and the candidate's work experience and projects relevant for the job role. Do not skip any topics. Allow the candidate to respond to each question before moving on to the next.  \n    NEVER SUMMARIZE OR REPEAT IN YOUR DIALOG THE CANDIDATE'S RESPONSE. Just ask the questions to the candidate without suggesting any possible answers.  \n    Remember that the candidate may not always provide accurate or truthful answers or not answer some portions of your questions. In such cases, push back and ask clarification or a revised response.  \n    In a single dialog with the candidate always be to the point and ALYWAYS ONLY ask questions when communicating with the interviewee and respond in a neutral diplomatic tone without letting the candidate know whether they are correct or incorrect.  \n    Do not discuss any topic which already has been discussed.\n    Based on the candidate's responses to each topic, respond as follows:  \n    1. If the response is partially correct or not complete, only say \"Okay. Please elaborate\" regarding the topic to be elaborated.\n    2. If the response is incorrect, contradictory, unsatisfactory or illogical, only say \"Okay\" and quickly move on to the next question on the same topic.  \n    3. If the response is correct, only say \"Okay\" and ask 2-3 in-depth technical and conceptual, follow-up questions, about the topic in discussion, one question at a time in your dialog based on the candidate's answer. These questions can cover definitions, formulas, technologies, and tools used.  \n    4. If the candidate is unaware about any topic, quickly move on to the next topic and ask a question.  \n    Always remember to ask questions unless you are conluding the interview.\n\n    Before beginning the interview, only introduce yourself as an \"Clarissa\" and welcome the candidate by their name which is already provided to you. Ask the candidate to introduce themselves, providing details such as their total years of experience, current company, and projects worked on. Based on that ALWAYS START THE INTERVIEW BY ASKING QUESTIONS ON THE PROJECTS MENTIONED  \n    When you conclude the interview, thank the candidate for the interview and inform that someone will communicate with the candidtate regarding this interview by using the exact phrase 'Someone will be in touch with you regarding the outcome' in your statement.  \n    ".
//     `;

//     this.messages.push({ role: 'system', content: systemPrompt });

//     // Start interview with the system context
//     this.startInterview();
//   }

//   // Step 2: Send system prompt → get AI's first question
//   private startInterview() {
//     this.apiService.sendConversation(this.messages).subscribe({
//       next: (res) => {
//         const content = res['choices'][0]['message']['content']
//         const aiGreeting = content;
//         this.addMessage('assistant', aiGreeting);
//         this.speakAI(aiGreeting);
//       },
//       error: (err) => {
//         console.error('Chat API error:', err);
//       }
//     });
//   }

//   // Step 3: AI speaks → auto start mic when done
//  private async speakAI(text: string) {
//     this.isSpeaking = true;
//    const res = await this.speechService.speakText(text);
//    if(res == "complete"){
//       this.startListening();
//    }

//   }

//   // Step 4: Candidate speaks → captured by Azure STT
//   private startListening() {
//     this.isListening = true;
//     console.log('🎙️ Listening for candidate response...');

//     this.speechService.startRecognition()
//       .then(candidateText => {
//         this.isListening = false;
//         const text = (candidateText || '').trim();

//         if (text.length > 0) {
//           console.log('✅ Candidate said:', text);
//           this.addMessage('user', text);
//           this.sendToBackend();
//         } else {
//           console.warn('⚠️ No speech detected, retrying...');
//           this.startListening();
//         }
//       })
//       .catch(err => {
//         console.error('Speech recognition error:', err);
//         this.isListening = false;
//         this.startListening();
//       });
//   }

//   // Step 5: Send conversation to backend → get AI response
//   private sendToBackend() {
//     this.apiService.sendConversation(this.messages).subscribe({
//       next: (res) => {
//         const content = res['choices'][0]['message']['content']
//         const aiResponse = content ;
//         this.addMessage('assistant', aiResponse);
//         this.speakAI(aiResponse); // repeat loop
//       },
//       error: (err) => {
//         console.error('Chat API error:', err);
//         this.startListening();
//       }
//     });
//   }

//   private addMessage(role: string, content: string) {
//     this.messages.push({ role, content });
//     console.log(`${role.toUpperCase()}:`, content);
//   }
// }
