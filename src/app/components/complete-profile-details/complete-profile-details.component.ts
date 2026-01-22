import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Candidate {
  initials: string;
  name: string;
  position: string;
  profileScore?: number;
  interviewScore?: number | string;
  experience?: string | number;
  skills?: string[];
  // Added for stack analysis
  profileAnalyzed?: boolean;
  qualification_score?: number;
  work_exp_score?: number;
  experience_score?: number;
  skills_score?: number;
  final_score_value?: number;
  overall_score?: number;
  resume_rel_info?: {
    work_experience?: {
      company?: string;
      position?: string;
      start_year?: string;
      end_year?: string;
      responsibilities?: string[];
    };
    email?: string;
    skills?: string[];
    project_names?: string[];
    project_tools?: string[];
    experience_months?: string;
  };
}

@Component({
    selector: 'complete-profile-details',
    imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, FormsModule, MatFormFieldModule, MatTooltipModule],
    templateUrl: './complete-profile-details.component.html',
    styleUrl: './complete-profile-details.component.scss'
})
export class CompleteProfileDetailsComponent {
  @Input() candidate: Candidate | null = null;

  editingEmail = false;
  editedEmail = '';
  
  ngOnChanges() {
    console.log('CompleteProfileDetails received candidate:', this.candidate);
    
    // Check if candidate has been analyzed based on the fields WITH valid values
    if (this.candidate) {
      const hasScoreValue = 
        (this.candidate.final_score_value !== undefined && this.candidate.final_score_value !== null && this.candidate.final_score_value > 0) || 
        (this.candidate.overall_score !== undefined && this.candidate.overall_score !== null && this.candidate.overall_score > 0);
        
      const hasComponentScores = 
        (this.candidate.qualification_score !== undefined && this.candidate.qualification_score !== null && this.candidate.qualification_score > 0) || 
        (this.candidate.work_exp_score !== undefined && this.candidate.work_exp_score !== null && this.candidate.work_exp_score > 0) ||
        (this.candidate.experience_score !== undefined && this.candidate.experience_score !== null && this.candidate.experience_score > 0) ||
        (this.candidate.skills_score !== undefined && this.candidate.skills_score !== null && this.candidate.skills_score > 0);
        
      // Only mark as analyzed if we have actual score values
      if (hasScoreValue || hasComponentScores) {
        this.candidate.profileAnalyzed = true;
        console.log('CompleteProfileDetails: Candidate has valid scores, marking as analyzed');
      } else {
        this.candidate.profileAnalyzed = false;
        console.log('CompleteProfileDetails: Candidate lacks valid scores, NOT marking as analyzed');
      }
    }
  }

  constructor(private cdr: ChangeDetectorRef) {}

  // Helper to get candidate name from flat or nested structure
  getCandidateName(candidate: any): string {
    return candidate?.name
      || candidate?.resume_rel_info?.name
      || candidate?.resume_rel_info?.fullName
      || candidate?.resume_rel_info?.candidate_name
      || 'Unknown';
  }
    // Helper to get candidate email from flat or nested structure
  getCandidateEmail(candidate: any): string {
    return candidate?.email
      || candidate?.resume_rel_info?.email
      || '';
  }

  // Helper to get initials from first and last word of the candidate's name
  getCandidateInitials(candidate: any): string {
    const name = this.getCandidateName(candidate)?.trim();
    if (!name) return '';
    const words = name.split(/\s+/);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  // Helper to always return an array for work_experience
  getWorkExperienceArray(): any[] {
    const wx = this.candidate?.resume_rel_info?.work_experience;
    if (Array.isArray(wx)) {
      return wx;
    }
    if (wx) {
      return [wx];
    }
    return [];
  }
  // Helper to get responsibilities/tasks for experience entry
  getResponsibilities(exp: any): string[] {
    if (Array.isArray(exp?.responsibilities)) {
      return exp.responsibilities;
    }
    if (Array.isArray(exp?.tasks)) {
      return exp.tasks;
    }
    return [];
  }

  
  // Default skills to use if candidate doesn't have any
  defaultSkills: string[] = [
    'Python', 'C++', 'Java', 'SQL', 'HTML/CSS', 
    'ReactJS', 'Git', 'Selenium', 'AWS', 'Unix'
  ];

  // Helper method to safely get skills
  getSkills(): string[] {
    return this.candidate?.skills || this.defaultSkills;
  }

  startEditEmail() {
    this.editingEmail = true;
    this.editedEmail = this.getCandidateEmail(this.candidate);
    this.cdr.detectChanges(); // Ensure tooltips are initialized
  }

  saveEmail() {
    if (this.editedEmail && this.candidate) {
      // Update the candidate email (adapt as needed for your model)
      if (this.candidate.resume_rel_info) {
        this.candidate.resume_rel_info.email = this.editedEmail;
      }
      this.editingEmail = false;
    }
  }

  cancelEditEmail() {
    this.editingEmail = false;
    this.editedEmail = '';
  }

  // Method to convert experience in months to years (e.g., 18 -> 1.5 years)
  getExperienceInYears(months: string | number | undefined): string {
    if (!months) return '-';
    const years = Number(months) / 12;
    return years.toFixed(1) + ' years';
  }

  getProfileScore(): number {
    if (!this.candidate) return 0;
    const score = this.candidate.final_score_value ?? this.candidate.overall_score;
    return typeof score === 'number' ? score : 0;
  }
}
