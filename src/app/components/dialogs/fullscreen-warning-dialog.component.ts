import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    selector: 'app-fullscreen-warning-dialog',
    imports: [CommonModule, MatDialogModule, MatDialogActions, MatDialogContent, MatDialogTitle],
    styleUrls: ['./fullscreen-warning-dialog.component.scss'],
    templateUrl: 'fullscreen-warning-dialog.component.html'
})
export class FullscreenWarningDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FullscreenWarningDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { exitCount: number, fullscreenElementSelector?: string }
  ) {}

  reenterFullscreen() {
    const el = document.querySelector(this.data.fullscreenElementSelector || 'html') as HTMLElement;
    if (el && el.requestFullscreen) {
      el.requestFullscreen();
      this.dialogRef.close();
    }
  }

  endInterview() {
    this.dialogRef.close('end');
  }

    // <button mat-button color="warn" (click)="endInterview()">End Interview</button>
}
