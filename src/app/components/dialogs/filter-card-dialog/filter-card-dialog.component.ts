import { Component, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-filter-card-dialog',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSliderModule,
        MatRadioModule,
        MatCheckboxModule,
        MatIconModule
    ],
    templateUrl: './filter-card-dialog.component.html',
    styleUrl: './filter-card-dialog.component.scss'
})
export class FilterCardDialogComponent {
  filterKeyword = '';
  // profileScoreMin = 0;
  profileScoreMin: number | null = null; //filter
  profileAnalysis = 'all';
  interviewScoreMin = 0;
  interviewInviteSent = false;
  interviewInviteNotSent = false;
  interviewInviteStatus: string = 'all';

  constructor(
    public dialogRef: MatDialogRef<FilterCardDialogComponent>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.filterKeyword = data.filterKeyword || '';
      this.profileScoreMin = data.profileScoreMin || 0;
      this.profileAnalysis = data.profileAnalysis || 'all';
      this.interviewScoreMin = data.interviewScoreMin || 0;
      this.interviewInviteStatus = data.interviewInviteStatus || 'all';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onReset(): void {
    this.dialogRef.close({ reset: true });
  }

  onApply(): void {
    this.dialogRef.close({
      filterKeyword: this.filterKeyword,
      // profileScoreMin: this.profileScoreMin,//filter
      profileScoreRange: this.profileScoreMin,
      profileAnalysis: this.profileAnalysis,
      interviewScoreMin: this.interviewScoreMin,
      interviewInviteStatus: this.interviewInviteStatus
    });
  }

  onFilterChange(): void {
    this.cdr.detectChanges();
  }

  isAnyFilterSelected(): boolean {
    // Check for keyword
    if (this.filterKeyword.trim().length > 0) return true;
    // Check for profile analysis
    if (this.profileAnalysis !== 'all' && this.profileAnalysis !== '') return true;
    // Check for profile score range (allow 0-100 only if not default)
    // if (this.profileScoreMin > 0) return true; //filter
     if (this.profileScoreMin !== null) return true;

    // Check for interview invite status
    if (this.interviewInviteStatus !== 'all' && this.interviewInviteStatus !== '') return true;
    // Check for interview score range
    if (this.interviewScoreMin > 0) return true;
    return false;
  }
}
