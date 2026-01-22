// Removed invalid property declaration outside the class
import { Component, inject, signal, OnInit } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// Direct component imports
import { AddRequirementsJobDetailsComponent } from '../add-requirements-job-details/add-requirements-job-details.component';
import { UploadResumesComponent } from '../upload-resumes/upload-resumes.component';
import { ViewAnalyzeProfilesComponent } from '../view-analyze-profiles/view-analyze-profiles.component';
import { CloseRequirementDialogComponent } from '../dialogs/close-requirement-dialog/close-requirement-dialog.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { AiService } from '../services/ai.service';
import { SpinnerService } from '../services/spinner.service';

@Component({
    selector: 'app-new-requirement',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        BreadcrumbsComponent,
        MatDialogModule,
        MatSnackBarModule,
        AddRequirementsJobDetailsComponent,
        UploadResumesComponent,
        ViewAnalyzeProfilesComponent,
        HttpClientModule,
        MatTooltipModule,
    ],
    styles: [`
    .title-field ::ng-deep .mat-mdc-text-field-wrapper {
      height: 51px !important;
    }
    .description-field ::ng-deep .mat-mdc-text-field-wrapper {
      height: 102px !important;
    }
    textarea {
      resize: none !important;
    }
  `],
    templateUrl: './new-requirement.component.html',
    styleUrl: './new-requirement.component.scss'
})
export class NewRequirementComponent implements OnInit {
  private pendingReupload: boolean = false;
  // Listen for resumeReuploaded event from child and refresh candidates
  onResumeReuploaded() {
    this.spinnerService.show();
    this.fetchCandidatesData();
  }
  // Handler for updated candidates from child (ViewAnalyzeProfilesComponent)
  onCandidatesUpdated(updatedList: any[]) {
    this.uploadedCandidates = updatedList;
    this.spinnerService.hide();
  }
  // Handler for updated candidates from child (ViewAnalyzeProfilesComponent)
  // onCandidatesUpdated(updatedList: any[]) {
  //   this.uploadedCandidates = updatedList;
  // }
  public resumeUploadCount: number = 0;
  // Handler for Reopen Requirement button
  onReopenRequirement() {
    // TODO: Add logic to reopen the requirement
    // console.log('Reopen Requirement clicked');
    // You can call a service or show a dialog here
  }
  // Internal formDisabled state
  private _formDisabled: boolean = false;
  get isReadOnlyRequirement(): boolean {
    return this._formDisabled;
  }
  private aiService = inject(AiService);
  private spinnerService = inject(SpinnerService);
  requirements: any[] = [];
  // Breadcrumb fragments
  breadcrumbs: string[] = ['Requirements'];
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  // Flag to determine if this is a new requirement or an existing one
  isExistingRequirement = false;

  // Store the requirementId from step 1
  requirementId: string = '';

  uploadedCandidates: any[] = [];

  // Store the title from query params
  requirementTitle: string = '';

  constructor() {}

  ngOnInit(): void {
    // Check for reqId and title in route params and auto-switch to step 1 if present
    this.route.params.subscribe(params => {
      if (params['reqId']) {
        this.requirementId = params['reqId'];
        this.isExistingRequirement = true;
        // Check if we need to load candidates data for this requirement
        this.route.queryParams.subscribe(qp => {
          if (qp['step'] === '3' || Number(qp['step']) === 3) {
            // We're going directly to step 3, so we need to fetch the candidates data
            this.fetchCandidatesData();
          }
          // Set resumeUploadCount from query params
          this.resumeUploadCount = +qp['resumeCount'] || 0;
        });
      } else if (params['id']) {
        this.isExistingRequirement = true;
        // Optionally load requirement data for 'id'
      } else {
        this.isExistingRequirement = false;
      }
    });
    // Read query params for title, step, and formDisabled
    this.route.queryParams.subscribe(qp => {
      if (qp['title']) {
        this.requirementTitle = qp['title'];
        this.breadcrumbs = ['Requirements'];
        if (qp['tab']) {
          this.breadcrumbs.push(qp['tab']);
        }
        this.breadcrumbs.push(qp['title']);
      } else {
        this.requirementTitle = this.isExistingRequirement ? 'View Requirement' : 'New Requirement';
        this.breadcrumbs = ['Requirements', this.requirementTitle];
      }
      // Set step and formDisabled from query params if present
      if (qp['step']) {
        this.setActiveStep(Number(qp['step']));
      }
      if (qp['formDisabled'] !== undefined) {
        this._formDisabled = qp['formDisabled'] === 'true' || qp['formDisabled'] === true;
      }
      // Also set resumeUploadCount from query params (for direct navigation)
      this.resumeUploadCount = +qp['resumeCount'] || this.resumeUploadCount;
    });
  }

  // Step management
  activeStep = signal(1);

  // setActiveStep(step: number) {
  //   this.activeStep.set(step);
  // }
setActiveStep(step: number) {
  if (step === 2 && !this.requirementId) {
    this.snackBar.open('Please complete step 1 first.', 'Close', { duration: 3000 });
    return;
  }
  
  // If going to step 3, ensure candidates data is loaded
  if (step === 3 && this.uploadedCandidates.length === 0 && this.requirementId) {
    // console.log('Going to step 3, but no candidates data loaded yet. Fetching data...');
    this.fetchCandidatesData();
    
    // If we're auto-navigating to step 3 from a card click, show a loading message
    if (this.uploadedCandidates.length === 0) {
      this.snackBar.open('Loading candidate profiles...', 'Close', { duration: 3000 });
    }
  }
  
  // If navigating to step 2 (Upload Resumes) and there are no candidates yet
  if (step === 2 && this.requirementId) {
    // console.log('Going to step 2 (Upload Resumes) for requirement:', this.requirementId);
    this.snackBar.open('You can now upload candidate resumes for this requirement', 'Close', { duration: 3000 });
  }
  
  this.activeStep.set(step);
}
  // Handler for AddRequirementsJobDetailsComponent proceed event
  onRequirementProceed(reqId: string) {
    this.requirementId = reqId;
    // console.log('requirementId in parent:', this.requirementId);
    this.setActiveStep(2);
  }

  // Handler for UploadResumesComponent proceed event
  onNextStep(candidatesData?: any[]) {
    if (candidatesData) {
      // console.log('Received candidates data:', candidatesData);
      
      this.uploadedCandidates = candidatesData;
    }
    if (this.activeStep() < 3) {
      this.setActiveStep(this.activeStep() + 1);
    }
  }

  onPreviousStep() {
    if (this.activeStep() > 1) {
      this.setActiveStep(this.activeStep() - 1);
    }
  }

  openCloseRequirementDialog(): void {
    const dialogRef = this.dialog.open(CloseRequirementDialogComponent, {
      width: '360px',
      panelClass: 'custom-dialog-container',
      disableClose: false, // Allow closing by clicking outside
      data: { requirementId: this.requirementId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // User confirmed closing the requirement
        // console.log('Closing requirement confirmed');
        // Debug: Attempt navigation
        console.log('Attempting navigation to /dashboard ...');
        this.router.navigate(['/dashboard'], {
          queryParams: { tab: 'closed' },
          replaceUrl: true // Force reload
        }).then(success => {
          // console.log('Navigation result:', success);
          // Show snackbar only after navigation completes
          this.snackBar.open('The requirement has been closed successfully and marked as completed.', 'Close', {
            duration: 4000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        });
      } else {
        // User canceled
        console.log('Closing requirement canceled');
        // Patch: Show a snackbar for cancel action for clarity
        this.snackBar.open('Requirement closure was canceled.', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
  
  // Method to fetch candidates data from the API with enhanced error handling and response parsing
  private fetchCandidatesData() {
    if (!this.requirementId) {
      // console.error('Cannot fetch candidates data: requirementId is not set');
      this.snackBar.open('Cannot load candidates: Requirement ID is missing', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    this.spinnerService.show();
    // console.log('Fetching candidates data for requirementId:', this.requirementId);
    // Add flag to fetch all analysis details as well
    // const payload = { req_id: this.requirementId, includeAnalysis: true };
    const payload = { req_id: this.requirementId };

    this.aiService.getAnalysisDetails(payload).subscribe({
      next: (response: any) => {
        // console.log('getAnalysisDetails raw response:', response);
        try {
          let candidatesData = null;
          
          // Check for various possible response structures
          if (response && response.data) {
            // Standard structure: { data: [...] }
            candidatesData = response.data;
          } else if (response && Array.isArray(response)) {
            // Direct array response
            candidatesData = response;
          } else if (response && response.candidates) {
            // Alternative structure: { candidates: [...] }
            candidatesData = response.candidates;
          } else if (response && response.result && response.result.data) {
            // Nested structure: { result: { data: [...] } }
            candidatesData = response.result.data;
          } else if (response && response.result && Array.isArray(response.result)) {
            // Nested array: { result: [...] }
            candidatesData = response.result;
          } else if (response && typeof response === 'object') {
            // Last resort: try to extract any array in the response
            const potentialArrays = Object.values(response).filter(val => Array.isArray(val));
            if (potentialArrays.length > 0) {
              // Use the first array found
              candidatesData = potentialArrays[0];
            }
          }
          
          // Process and assign the data if found
          if (candidatesData && Array.isArray(candidatesData)) {
            // Ensure no duplicate candidates by using a Map with ID as the key
            const uniqueCandidatesMap = new Map();
            
            candidatesData.forEach(candidate => {
              if (candidate.id) {
                uniqueCandidatesMap.set(candidate.id, candidate);
              }
            });
            
            // Convert Map back to array
            this.uploadedCandidates = Array.from(uniqueCandidatesMap.values());
            // console.log('Candidates data loaded successfully (after duplicate removal):', this.uploadedCandidates.length);
            
            // Debug logging of candidate structure
            if (this.uploadedCandidates.length > 0) {
              // console.log('First candidate sample structure:', JSON.stringify(this.uploadedCandidates[0], null, 2));
            }
            
            if (this.uploadedCandidates.length === 0) {
              this.snackBar.open('No candidates found for this requirement', 'Close', {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top'
              });
            }
            this.spinnerService.hide();
            // Call onCandidatesUpdated to trigger snackbar after spinner is hidden
            this.onCandidatesUpdated(this.uploadedCandidates);
          } else {
            // console.error('Could not extract candidates data from response:', response);
            this.uploadedCandidates = [];
            this.snackBar.open('Could not extract candidate data from response', 'Close', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            });
            this.spinnerService.hide();
          }
        } catch (parseError) {
          console.error('Error parsing candidate response data:', parseError);
          this.uploadedCandidates = [];
          this.snackBar.open('Error parsing candidate data', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.spinnerService.hide();
        }
      },
      error: (err: any) => {
        console.error('Error fetching candidates data:', err);
        this.uploadedCandidates = [];
        let errorMessage = 'Failed to load candidates data';
        if (err.status === 404) {
          errorMessage = 'No candidates found for this requirement';
        } else if (err.status === 401 || err.status === 403) {
          errorMessage = 'You do not have permission to view these candidates';
        } else if (err.status === 500) {
          errorMessage = 'Server error while loading candidates';
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        }
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.spinnerService.hide();
      }
    });
  }
}

