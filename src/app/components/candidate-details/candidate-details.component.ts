import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Candidate {
  initials: string;
  name: string;
  position: string;
  selected?: boolean;
  emailSent?: boolean;
  profileScore?: number;
  interviewScore?: number | string;
  matchScore?: number;
  analyzing?: boolean;
  finalScore?: number;
  resumeShortlistScore?: number;
  skillsScore?: number;
  workExpScore?: number;
  final_score_value?: number;
  overall_score?: number;
  qualification_score?: number;
  work_exp_score?: number;
  experience_score?: number;
  skills_score?: number;
  profileAnalyzed?: boolean;
}

@Component({
    selector: 'candidate-details',
    imports: [CommonModule, MatCheckboxModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule, MatProgressSpinnerModule],
    templateUrl: './candidate-details.component.html',
    styleUrl: './candidate-details.component.scss'
})
export class CandidateDetailsComponent {


  // Call this method when reupload is triggered (e.g., from a button click)
  onReuploadResume(file: File, candidate: any) {
    this.uploadProfileToCandidate.emit({ file, candidate });
  }
  @Input() candidates: Candidate[] = [];
  @Input() filteredCandidates: Candidate[] = [];
  @Input() activeFilters: any[] = [];
  @Input() selectionMode: boolean = false;
  @Input() jobRole: string ='';
  
  ngOnChanges() {
    // Log all candidates received from parent for cross-check
   
  }

  @Output() candidateSelected = new EventEmitter<Candidate>();
  @Output() candidateSelectionToggled = new EventEmitter<{candidate: Candidate, event: any}>();
  @Output() sendEmailToCandidate = new EventEmitter<Candidate>();
  @Output() analyzeProfileToCandidate = new EventEmitter<Candidate>();
  @Output() uploadProfileToCandidate = new EventEmitter<{ file: File, candidate: Candidate }>();
  // Safely get candidate name from flat or nested structure, checking common alternatives
  getCandidateName(candidate: any): string {
    if (candidate?.resume_rel_info?.name) {
      return candidate.resume_rel_info.name;
    }
    return candidate?.name
      || candidate?.fullName
      || candidate?.candidate_name
      || candidate?.resume_rel_info?.fullName
      || candidate?.resume_rel_info?.candidate_name
      || 'Unknown';
  }

  // Get initials from first and last word of the candidate's name
  getCandidateInitials(candidate: any): string {
    const name = this.getCandidateName(candidate)?.trim();
    if (!name) return '';
    const words = name.split(/\s+/);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }


selectCandidate(candidate: Candidate): void {
  candidate.name = this.getCandidateName(candidate);
  candidate.initials = this.getCandidateInitials(candidate);
  
  // Check if the candidate has been analyzed based on valid score values
  const hasScoreValue = 
    (candidate.final_score_value !== undefined && candidate.final_score_value !== null && candidate.final_score_value > 0) || 
    (candidate.overall_score !== undefined && candidate.overall_score !== null && candidate.overall_score > 0);
    
  const hasComponentScores = 
    (candidate.qualification_score !== undefined && candidate.qualification_score !== null && candidate.qualification_score > 0) || 
    (candidate.work_exp_score !== undefined && candidate.work_exp_score !== null && candidate.work_exp_score > 0) ||
    (candidate.experience_score !== undefined && candidate.experience_score !== null && candidate.experience_score > 0) ||
    (candidate.skills_score !== undefined && candidate.skills_score !== null && candidate.skills_score > 0);
    
  // Only mark as analyzed if we have actual score values
  if (hasScoreValue || hasComponentScores) {
    candidate.profileAnalyzed = true;
   
  } else {
    candidate.profileAnalyzed = false;
    
  }
  
 
  this.candidateSelected.emit(candidate);
}
  toggleCandidateSelection(candidate: Candidate, event: any): void {
    this.candidateSelectionToggled.emit({candidate, event});
  }
  
  sendEmail(event: Event, candidate: Candidate): void {
    event.stopPropagation();
    
    // Set emailSent to true locally before emitting
    candidate.emailSent = true;
    
    // Emit the event to parent component
    this.sendEmailToCandidate.emit(candidate);
  }

  analyzeProfile(event: Event, candidate: Candidate): void {
  event.stopPropagation();
  candidate.analyzing = true;
  // Emit the event to parent component for single candidate analysis
  this.analyzeProfileToCandidate.emit(candidate);
  }
  
  // Helper method to safely get the candidate score
  getScore(candidate: Candidate): number {
    return candidate?.final_score_value || candidate?.overall_score || 0;
  }

  // Helper method to determine progress bar color based on score
  getScoreColor(candidate: Candidate): string {
    const score = this.getScore(candidate);
    if (score >= 50) {
      return 'high-score'; // Green for scores 50% and above
    } else {
      return 'low-score'; // Red for scores below 50%
    }
  }

  uploadProfile(candidate: Candidate, event: Event): void {
   
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Emit only file and candidate to parent component
      this.uploadProfileToCandidate.emit({ file, candidate });
    }
  }
}
