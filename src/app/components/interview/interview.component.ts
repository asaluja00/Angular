
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { AiService } from '../services/ai.service';
import { SpinnerService } from '../services/spinner.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
    selector: 'app-interview',
    imports: [CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        SpinnerComponent],
    templateUrl: './interview.component.html',
    styleUrl: './interview.component.scss'
})
export class InterviewComponent {
    interviewStatus: string = '';
    isEarlyAccess: boolean = false;
    isLinkExpired: boolean = false;
    id: string | undefined;
    candidateName: string = 'Saurabh Gupta';
    jobRole: string = 'Senior Software Engineer';
    scheduledTime: Date = new Date('2025-07-15T10:00:00');
    isLoading: boolean = false;
    private route = inject(ActivatedRoute);
    private aiservice = inject(AiService);
    constructor(private router: Router) {}
    private spinnerService = inject(SpinnerService);
  ngOnInit() {
   this.isLoading = true;
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

          // --- Routing/logic based on interview status and access ---
          if (this.interviewStatus === 'pending' && this.isEarlyAccess === true && this.isLinkExpired === false) {
            this.router.navigate(['/early-access', this.id]);
            return;
          }
          if (this.isEarlyAccess === false && this.isLinkExpired === false && this.interviewStatus === 'pending') {
        
            this.router.navigate(['/interview-precheck', this.id]);
            return;
          }
          if (this.isEarlyAccess === false && this.isLinkExpired === true && this.interviewStatus === 'pending') {
          
              this.isLoading = true;
            this.router.navigate(['/error-message'], { queryParams: { reason: 'expired' } });
            return;
          }
          if (this.interviewStatus === 'completed') {
          
            this.spinnerService.hide();
            this.router.navigate(['/error-message'], { queryParams: { reason: 'completed' } });
            return;
          }
  
          this.spinnerService.hide();
          this.router.navigate(['/error'], { queryParams: { reason: 'invalid' } });
        },
        error: (err) => {
            this.spinnerService.hide();
         
        }
      });
    });
  }

}
