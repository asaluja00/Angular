import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AiService } from '../../services/ai.service';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-close-requirement-dialog',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatCardModule,
        MatSnackBarModule
    ],
    templateUrl: './close-requirement-dialog.component.html',
    styleUrl: './close-requirement-dialog.component.scss'
})
export class CloseRequirementDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CloseRequirementDialogComponent>,
    private aiService: AiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    const requirementId = this.getRequirementId();
    this.aiService.closeRequirement({ req_id: requirementId }).subscribe({
      next: (result) => {
      
        this.dialogRef.close(true);
      },
      error: (err) => {
      
        this.snackBar.open('Failed to close requirement. Please try again.', 'Close', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.dialogRef.close(false);
      }
    });
  }

  // Placeholder for getting the requirement id
  getRequirementId(): string {
    return this.data.requirementId;
  }
}
