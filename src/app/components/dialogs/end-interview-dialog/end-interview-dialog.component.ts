import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-end-interview-dialog',
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './end-interview-dialog.component.html',
    styleUrls: ['./end-interview-dialog.component.scss']
})
export class EndInterviewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EndInterviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
