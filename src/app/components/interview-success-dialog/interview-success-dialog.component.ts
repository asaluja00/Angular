import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-interview-success-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="success-dialog">
      <div class="success-circle">
        <mat-icon>check</mat-icon>
      </div>
      <h2 class="mat-headline-5">Your interview has been scheduled successfully!</h2>
      <p class="mat-subtitle-1">We are excited to meet you!</p>
      <div class="details-card">
        <p><strong>Date:</strong> {{data.date | date:'EEEE d\'th\' MMMM, y'}}</p>
        <p><strong>Time:</strong> {{data.time}}</p>
        <p><strong>Duration:</strong> 1 Hour</p>
      </div>
      <p class="note mat-body-1">Please check your email for confirmation<br>and further instructions</p>
    </div>
  `,
  styles: [`
    .success-dialog {
      padding: 32px;
      text-align: center;
      max-width: 400px;
    }
    .success-circle {
      width: 64px;
      height: 64px;
      background: #E8F5E9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .success-circle mat-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      color: #4CAF50;
    }
    h2 {
      margin: 0 0 8px;
      color: rgba(0, 0, 0, 0.87);
    }
    .mat-subtitle-1 {
      margin: 0 0 24px;
      color: rgba(0, 0, 0, 0.6);
    }
    .details-card {
      background: #F5F5F5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
    }
    .details-card p {
      margin: 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }
    .note {
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.5;
      margin: 0;
    }
  `]
})
export class InterviewSuccessDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}