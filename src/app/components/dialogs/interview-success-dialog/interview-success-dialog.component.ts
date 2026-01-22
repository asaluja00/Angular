import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-interview-success-dialog',
    imports: [
        CommonModule,
        MatDialogModule,
        MatIconModule,
        MatCardModule
    ],
    templateUrl: './interview-success-dialog.component.html',
    styleUrls: ['./interview-success-dialog.component.scss']
})
export class InterviewSuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InterviewSuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      date: Date;
      time: string;
    }
  ) {}

  getTimeFormat(time: string): string {
    if (!time) return '';
    const hour = parseInt(time.split(':')[0]);
    const minutes = time.split(':')[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}
