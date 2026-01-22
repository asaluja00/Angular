import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AiService } from '../../services/ai.service';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-confirm-proceed-dialog',
    imports: [
        CommonModule,
        MatDialogModule,
        MatSnackBarModule,
        MatButtonModule,
        MatCardModule
    ],
    templateUrl: './confirm-proceed-dialog.component.html',
    styleUrl: './confirm-proceed-dialog.component.scss'
})
export class ConfirmProceedDialogComponent {

  constructor(
      public dialogRef: MatDialogRef<ConfirmProceedDialogComponent>,
      private aiService: AiService,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private snackBar: MatSnackBar
    ) {}
  
    onCancel(): void {
      this.dialogRef.close(false);
    }
  
    onConfirm(): void {
      this.dialogRef.close('confirm');
    }
}
