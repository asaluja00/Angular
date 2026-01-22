import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InterviewApiService {
  private baseUrl = 'https://10.179.82.226:8443'; // update with your backend

  constructor(private http: HttpClient) {}

  sendConversation(messages: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat`, { messages });
  }
  
}
