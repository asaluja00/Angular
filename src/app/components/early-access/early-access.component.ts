import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { AiService } from '../services/ai.service';

@Component({
    selector: 'app-early-access',
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: './early-access.component.html',
    styleUrls: ['./early-access.component.scss']
})
export class EarlyAccessComponent {
  interviewStatus: string = '';
  isEarlyAccess: boolean = false;
  isLinkExpired: boolean = false;
  id: string | undefined;
  candidateName: string = 'Saurabh Gupta';
  jobRole: string = 'Senior Software Engineer';
  scheduledTime: Date = new Date('2025-07-15T10:00:00');
  isLoading: boolean = true;
  candidateInitials: string = '';
  isDropdownOpen: boolean = false;
  private route = inject(ActivatedRoute);
  private aiservice = inject(AiService);
  constructor(private router: Router) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params['id'];
    

      // Call getProfileData API with id as payload
      this.aiservice.getCandidateDetails({ id: this.id }).subscribe({
        next: (data) => {
        
          // Assign API response fields to component properties
          this.candidateName = data.candidate_name;
          this.jobRole = data.job_role;
          this.scheduledTime = new Date(data.scheduled_utc_time);
          this.interviewStatus = data.interview_status;
          this.isEarlyAccess = data.isEarlyAccess;
          this.isLinkExpired = data.isLinkExpired;
          //candiate initials extract
          this.candidateInitials = this.getInitials(this.candidateName);

        },
        error: (err) => {

        }
      });
    });
  }

  onCancel() {
    // Add navigation logic
  }

  onBegin() {
    if (this.isInterviewTime() && this.id) {
      this.router.navigate([`/started-interview/${this.id}`]);
    }
  }

  isInterviewTime(): boolean {
    const now = new Date();
    // Enable if all conditions are satisfied
    return (
      this.interviewStatus === 'pending' &&
      this.isEarlyAccess === true &&
      this.isLinkExpired === false
    );
  }

   toggleDropdown() {
  this.isDropdownOpen = !this.isDropdownOpen;
}

getInitials(name: string): string {
    if (!name) return '';
    const words = name.split(' ').filter((w: string) => w.length > 0);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }
}
