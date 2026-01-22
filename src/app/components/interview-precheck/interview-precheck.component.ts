import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AiService } from '../services/ai.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
    selector: 'app-interview-precheck',
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: './interview-precheck.component.html',
    styleUrls: ['./interview-precheck.component.scss']
})
export class InterviewPreCheckComponent implements OnInit {
  candidateName: string = '';
  jobRole: string = '';
  scheduledTime: Date = new Date();
  id: string | undefined;
  isLoading: boolean = true;
  interviewStatus: string = '';
  isEarlyAccess: boolean = false;
  isLinkExpired: boolean = false;
  candidateInitials: string = '';
  isDropdownOpen: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private aiservice: AiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (!this.id) return;
      this.aiservice.getCandidateDetails({ id: this.id }).subscribe({
        next: (data) => {
          this.candidateName = data.candidate_name;
          this.jobRole = data.job_role;
          this.scheduledTime = new Date(data.scheduled_utc_time);
          this.interviewStatus = data.interview_status;
          this.isEarlyAccess = data.isEarlyAccess;
          this.isLinkExpired = data.isLinkExpired;
          this.isLoading = false;
          //extract candidate initial
          this.candidateInitials = this.getInitials(this.candidateName);
        },
        error: (err) => {
       
          this.isLoading = false;
        }
      });
    });
  }

  onCancel() {
    // Add navigation logic
    // add logic to navigate to a specific page if needed
  }

  onBegin() {
    if (this.id) {
      this.router.navigate([`/started-interview/${this.id}`]);
    }
  }

  isInterviewTime(): boolean {
    return (
      this.interviewStatus === 'pending' &&
      this.isEarlyAccess === false &&
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
