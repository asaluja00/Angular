import { MatDialog } from '@angular/material/dialog';
import { FilterCardDialogComponent } from '../dialogs/filter-card-dialog/filter-card-dialog.component';
import { Component, EventEmitter, Output, HostListener, ElementRef, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CompleteProfileDetailsComponent } from '../complete-profile-details/complete-profile-details.component';
import { CandidateDetailsComponent } from '../candidate-details/candidate-details.component';
import { ViewRequirementDetailsComponent } from '../view-requirement-details/view-requirement-details.component';
import { AiService } from '../services/ai.service';
import { Candidate as SharedCandidate } from '../../models/candidate.interface';
import { ViewChild } from '@angular/core';
import { MatDrawer, MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { GlobalPositionStrategy,Overlay } from '@angular/cdk/overlay';
interface Candidate extends Omit<SharedCandidate, 'req_id'> {
  req_id?: string | null;
  
  resume_rel_info?: {
    education_qualification?: {
      cgpa?: string;
      degree?: string;
      field?: string;
      graduation_end_year?: string;
      graduation_start_year?: string;
      institution?: string;
      percentage?: string;
      
    };
    email?: string;
    name?: string;
    project_names?: string[];
    project_tools?: string[];
    skills?: string[];
    work_experience?: {
      company?: string;
      end_year?: string;
      position?: string;
      responsibilities?: string[];
      start_year?: string;
      
    };
  };
}

@Component({
    selector: 'app-view-analyze-profiles',
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatSliderModule,
        FormsModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatListModule,
        MatRadioModule,
        CompleteProfileDetailsComponent,
        CandidateDetailsComponent,
        ViewRequirementDetailsComponent,
        MatSidenavModule,
    ],
    templateUrl: './view-analyze-profiles.component.html',
    styleUrl: './view-analyze-profiles.component.scss'
})
export class ViewAnalyzeProfilesComponent implements OnInit, OnChanges {
  @Output() reuploadResume = new EventEmitter<{ file: File, candidate: any }>();
  @Output() resumeReuploaded = new EventEmitter<void>();
  @Input() requirementId: string | null = null;
  positionStrategy = new GlobalPositionStrategy().top('0').right('0');
  filterKeyword: string = '';
  interviewInviteStatus: string = 'all'// filter
  @Output() proceed = new EventEmitter<void>();
  @Input() candidates: Candidate[] = [];


  // job role 
  jobRole: string = '';
  requirementDetails: any = null;

  //job role method

  loadRequirementDetails(): void {
  if (!this.requirementId) {
    console.warn('⚠️ requirementId not available');
    return;
  }
 
  const payload = {
    req_id: this.requirementId
  };
 
  this.aiService.getRequirementDetails(payload).subscribe({
    next: (res: any) => {
      console.log('✅ Requirement API response:', res);
 
      this.requirementDetails = res;
 
      // 🔥 THIS IS THE IMPORTANT LINE
      this.jobRole =
        res?.jobRole ||
        res?.job_role ||
        res?.jobRoleName ||
        '';
 
      console.log('🎯 Job Role set to:', this.jobRole);
    },
    error: (err) => {
      console.error('❌ Requirement API failed', err);
    }
  });
}


  onQuickReferenceClick() {
    console.log('Quick Reference icon clicked', this.requirementId);
    
    this.dialog.open(ViewRequirementDetailsComponent, {
      width: '620px',
      maxWidth: '95vw',
      // positionStrategy: this.positionStrategy,
      // panelClass: 'quick-reference-dialog',
      position: { right: '0' },
      data: {
        requirementId: this.requirementId
      }
    });
    console.log('Quick Reference icon clicked, ViewRequirementDetailsComponent dialog opened at right end with requirementId:', this.requirementId);
  }
   // Handle resume re-upload event from candidate-details
  onReuploadResume({ file, candidate }: { file: File, candidate: any }) {
    // Option 1: Handle API call here, then emit event to parent to refresh
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('req_id', candidate.req_id || '');
    formData.append('candidate_id', candidate.id || '');

    this.aiService.reuploadResume(formData).subscribe(
      event => {
        console.log("this.resumeReuploaded called......................");
        
        this.snackBar.open('Resume reupload successful', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        // Notify parent to refresh candidates
        this.resumeReuploaded.emit();
        // Clear selected candidate after reupload
        this.selectedCandidate = null;
      },
      error => {
        console.error('Resume re-upload error:', error);
        this.snackBar.open('Resume reupload failed', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    );
  }

  



  private aiService = inject(AiService);
  constructor(
    private snackBar: MatSnackBar,
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

    ngOnInit(): void {
      //job role oninit

       
  // 1️⃣ If requirementId comes from @Input
  if (this.requirementId) {
    this.loadRequirementDetails();
  }
 
  // 2️⃣ If requirementId comes from route
  this.route.params.subscribe(params => {
    if (params['reqId']) {
      this.requirementId = params['reqId'];
      this.loadRequirementDetails(); // 🔥 REQUIRED
    }
  });



    // Initialize filteredCandidates
    if (this.candidates && Array.isArray(this.candidates) && this.candidates.length > 0) {
     
      
      // Check and mark profiles that have already been analyzed
      this.markAnalyzedProfiles();
      
      this.filteredCandidates = [...this.candidates];
     
      
      // If we have candidates data, select the first one by default for better UX
      if (!this.selectedCandidate && !this.selectionMode) {
        setTimeout(() => {
          if (this.candidates.length > 0) {
            this.selectCandidate(this.candidates[0]);
          }
        }, 200);
      }
    } else {

      this.filteredCandidates = [];
      
      // If we have a requirementId but no candidates data, we might want to fetch it directly
      // This is a fallback in case the parent component didn't provide the data
      if (this.requirementId && (!this.candidates || this.candidates.length === 0)) {
      }
    }
  }
  
  // Helper method to mark profiles as analyzed
  markAnalyzedProfiles(): void {
    if (!this.candidates || !Array.isArray(this.candidates)) {
      return;
    }
    
    this.candidates.forEach(candidate => {
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
        // console.log(`Candidate ${candidate.id} is marked as analyzed with valid scores`);
      } else {
        candidate.profileAnalyzed = false;
        console.log(`Candidate ${candidate.id} is NOT marked as analyzed - no valid scores found`);
      }
    });
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Check if candidates changed
    if (changes['candidates']) {
  
      // Remove any potential duplicates from the candidates array using Map
      if (this.candidates && Array.isArray(this.candidates) && this.candidates.length > 0) {
        // Use a Map to deduplicate by ID
        const uniqueCandidatesMap = new Map();
        
        this.candidates.forEach(candidate => {
          if (candidate.id) {
            uniqueCandidatesMap.set(candidate.id, candidate);
          }
        });
        
        // Convert Map back to array and update candidates
        this.candidates = Array.from(uniqueCandidatesMap.values());
        
        // Use our helper method to mark analyzed profiles
        this.markAnalyzedProfiles();        
        // Update filtered candidates
        this.filteredCandidates = [...this.candidates];
        
        // Reapply any active filters
        if (this.activeFilters.length > 0) {
          this.applyActiveFilters();
        }
      } else {
        if (this.requirementId) {
        }
      }
    }
    
    // Check if requirementId changed
    if (changes['requirementId'] && this.requirementId) {
      
    }
    
    // Get requirementId from @Input or from route params
    if (!this.requirementId) {
      this.route.params.subscribe(params => {
        if (params['reqId']) {
          this.requirementId = params['reqId'];
  
        }
      });
    } else {
    
    }
  }
  

  
  // ...existing code...
  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterCardDialogComponent, {
      width: '332px',
      height: '490px',
      data: {
        filterKeyword: this.filterKeyword,
        profileScoreMin: this.activeFilters.find(f => f.type === 'profileScore')?.value || 0,
        profileAnalysis: this.activeFilters.find(f => f.type === 'profileAnalyzed')?.value || 'all',
        interviewScoreMin: this.activeFilters.find(f => f.type === 'interviewScore')?.value || 0,
        interviewInviteStatus: this.activeFilters.find(f => f.type === 'emailSent')?.value || 'all'
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {
     if (result?.reset) {
        this.resetFilter();
      } else if (result) {
        this.applyFilterFromDialog(result);
      }
      // else if (result?.filterKeyword) {
      //   this.applyFilterFromDialog(result);
      // }
    });
  }

  // filteredCandidates already declared above
  activeFilters: any[] = [];

  // Search candidates by name or skill
  searchCandidates(keyword: string): void {
    const lowerKeyword = keyword.trim().toLowerCase();
    if (!lowerKeyword) {
      this.filteredCandidates = [...this.candidates];
      return;
    }
    this.filteredCandidates = this.candidates.filter(candidate => {
      const nameMatch = candidate.resume_rel_info?.name?.toLowerCase().includes(lowerKeyword);
      const skillMatch = candidate.resume_rel_info?.skills?.some(skill => skill.toLowerCase().includes(lowerKeyword));
      return nameMatch || skillMatch;
    });
  }

  // applyFilterFromDialog(filter: any): void {
  //   // this.filterKeyword = filter.filterKeyword;
  //   // console.log('Filter applied from dialog:', filter);

  //   // console.log('Filter keyword set to:', this.filterKeyword);

  //   // this.searchCandidates(this.filterKeyword);
  //   // // Optionally update activeFilters for UI
  //   // this.activeFilters = [{ type: 'search', value: this.filterKeyword }];
  //   // console.log('Filter applied:', filter);
  // this.filterKeyword = (filter.filterKeyword || '').trim().toLowerCase();
  // this.profileAnalysis = filter.profileAnalysis || 'all';
  // this.interviewInviteStatus = filter.interviewInviteStatus || 'all';

  // console.log('🔍 Applying Filters');
  // console.log('Filter Keyword:', this.filterKeyword);
  // console.log('Profile Analysis:', this.profileAnalysis);
  // console.log('Interview Invite Status:', this.interviewInviteStatus);

  // this.filteredCandidates = this.candidates.filter(candidate => {
  //   const name = candidate.resume_rel_info?.name?.toLowerCase() || '';
  //   const skills: string[] = candidate.resume_rel_info?.skills?.map(s => s.toLowerCase()) || [];

  //   // Keyword match
  //   const nameMatch = name.includes(this.filterKeyword);
  //   const skillMatch = skills.some(skill => skill.includes(this.filterKeyword));
  //   const keywordMatch = this.filterKeyword === '' || nameMatch || skillMatch;

  //   // Profile analysis match
  //   const overall_score = candidate.overall_score ?? 0;
  //   const analysisMatch =
  //     this.profileAnalysis === 'all' ||
  //     (this.profileAnalysis === 'done' && overall_score > 0) ||
  //     (this.profileAnalysis === 'notdone' && overall_score === 0);

  //   // ✅ Use emailSent field instead of interviewInviteSent
  //   const emailSent = candidate.emailSent ?? false;

  //   let interviewMatch = true;
  //   if (this.interviewInviteStatus === 'sent') {
  //     interviewMatch = emailSent === true;
  //   } else if (this.interviewInviteStatus === 'notsent') {
  //     interviewMatch = emailSent === false;
  //   }

  //   // Debug logs
  //   console.log('Candidate Name:', name);
  //   console.log('Candidate Skills:', skills);
  //   console.log('Overall Score:', overall_score);
  //   console.log('Email Sent:', emailSent);
  //   console.log('Keyword Match:', keywordMatch);
  //   console.log('Analysis Match:', analysisMatch);
  //   console.log('Interview Match:', interviewMatch);

  //   const isMatch = keywordMatch && analysisMatch && interviewMatch;
  //   console.log('✅ Candidate Match:', isMatch);

  //   return isMatch;
  // });

  // console.log('🎯 Filtered Candidates:', this.filteredCandidates);

  // this.activeFilters = [
  //   { type: 'search', value: this.filterKeyword },
  //   { type: 'profileAnalyzed', value: this.profileAnalysis },
  //   { type: 'interviewInviteStatus', value: this.interviewInviteStatus }
  // ];
  // }

  //after Girija
  applyFilterFromDialog(filter: any): void {
  // 🔍 Search keyword
  this.filterKeyword = (filter.filterKeyword || '').trim().toLowerCase();
 
  // 📊 Profile analysis filter
  this.profileAnalysis = filter.profileAnalysis || 'all';
 
  // ✉️ Interview invite filter
  this.interviewInviteStatus = filter.interviewInviteStatus || 'all';
 
  // 🎯 Profile score range (IMPORTANT)
  const selectedScore: number | null =
    filter.profileScoreRange !== undefined && filter.profileScoreRange !== null
      ? Number(filter.profileScoreRange)
      : null;
 
  console.log('🔍 Applying Filters');
  console.log('Keyword:', this.filterKeyword);
  console.log('Profile Analysis:', this.profileAnalysis);
  console.log('Interview Invite:', this.interviewInviteStatus);
  console.log('Selected Score Range:', selectedScore);
 
  this.filteredCandidates = this.candidates.filter(candidate => {
    // -------------------------------
    // Candidate basic data
    // -------------------------------
    const name = candidate.resume_rel_info?.name?.toLowerCase() || '';
    const skills: string[] =
      candidate.resume_rel_info?.skills?.map((s: string) => s.toLowerCase()) || [];
 
    const overall_score: number = Number(candidate.overall_score) || 0;
    const emailSent: boolean = candidate.emailSent ?? false;
 
    // -------------------------------
    // Keyword match
    // -------------------------------
    const nameMatch = name.includes(this.filterKeyword);
    const skillMatch = skills.some(skill =>
      skill.includes(this.filterKeyword)
    );
 
    const keywordMatch =
      this.filterKeyword === '' || nameMatch || skillMatch;
 
    // -------------------------------
    // Profile analysis match
    // -------------------------------
    const analysisMatch =
      this.profileAnalysis === 'all' ||
      (this.profileAnalysis === 'done' && overall_score > 0) ||
      (this.profileAnalysis === 'notdone' && overall_score === 0);
 
    // -------------------------------
    // Profile score range match
    // (score <= selected value)
    // -------------------------------
    const scoreRangeMatch =
      selectedScore === null || overall_score >= selectedScore;
 
    // -------------------------------
    // Interview invite match
    // -------------------------------
    let interviewMatch = true;
    if (this.interviewInviteStatus === 'sent') {
      interviewMatch = emailSent === true;
    } else if (this.interviewInviteStatus === 'notsent') {
      interviewMatch = emailSent === false;
    }
 
    // -------------------------------
    // Final match
    // -------------------------------
    const isMatch =
      keywordMatch &&
      analysisMatch &&
      scoreRangeMatch &&
      interviewMatch;
 
    return isMatch;
  });
 
  // 🏷️ Active filters display
  this.activeFilters = [
    { type: 'search', value: this.filterKeyword },
    { type: 'profileAnalyzed', value: this.profileAnalysis },
    { type: 'profileScoreRange', value: selectedScore },
    { type: 'interviewInviteStatus', value: this.interviewInviteStatus }
  ];
 
  console.log('🎯 Filtered Candidates:', this.filteredCandidates);
}


  selectedCandidate: Candidate | null = null;
  selectionMode = false;
  selectedCount = 0;
  filterVisible = false;
  showFilterOptions = false;
  selectedFilterOption: string | null = null;
  filterValue: string = 'yes';
  
  // Filtered candidates array and active filters
  filteredCandidates: Candidate[] = [];
  // activeFilters already declared above as any[]

  // Filter card state variables
  // Remove duplicate filter card state variables
  profileAnalysis: string = 'all';
  interviewInviteSent: boolean = false;
  interviewInviteNotSent: boolean = false;

  toggleSelectionMode() {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      // Reset selections when exiting selection mode
      this.resetSelections();
    }
  }
  
  selectCandidate(candidate: Candidate) {
    if (this.selectionMode) {
      // In selection mode, toggle the selected state
      candidate.selected = !candidate.selected;
      this.updateSelectedCount();
    } else {
      // In view mode, set the selected candidate for viewing details
      console.log('Setting selectedCandidate:', candidate);
      
      // Ensure the profileAnalyzed property is correctly set
      // by reusing our helper method logic for consistency
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
        console.log('Candidate has valid score values, marking as analyzed');
      } else {
        candidate.profileAnalyzed = false;
        console.log('Candidate lacks valid score values, NOT marking as analyzed');
      }
      
      this.selectedCandidate = candidate;
    }
  }
  
  updateSelectedCount() {
    this.selectedCount = this.candidates.filter(c => c.selected).length;
  }
  
  resetSelections() {
    this.candidates.forEach(c => c.selected = false);
    this.selectedCount = 0;
  }
  
  selectAll(checked: boolean) {
    this.candidates.forEach(c => c.selected = checked);
    this.updateSelectedCount();
  }
  
  toggleCandidateSelection(candidate: Candidate, event: any) {
    candidate.selected = event.checked;
    this.updateSelectedCount();
  }
  
  sendEmail(candidates: Candidate[]) {
    if (!candidates || candidates.length === 0) return;
    const req_id = candidates[0].req_id || null;
    const candidate_ids = candidates.map(c => c.id);
    const payload = { req_id, candidate_ids };
    console.log('Sending email payload:', payload);
    this.aiService.sendEmailToCandidates(payload).subscribe(
      response => {
        candidates.forEach(candidate => {
          candidate.emailSent = true;
        });
        const message = candidates.length === 1
          ? `An email has been sent to ${this.getCandidateName(candidates[0])} for interview scheduling. The AI will conduct the interview and deliver the evaluation transcript.`
          : 'An email has been sent to the selected candidates for interview scheduling. The AI will conduct the interview and deliver the evaluation transcript.';
        this.snackBar.open(
          message,
          '✕',
          {
            duration: 8000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          }
        );
        this.selectionMode = false;
      },
      error => {
        const message = candidates.length === 1
          ? `Failed to send email to ${this.getCandidateName(candidates[0])}. Please try again.`
          : 'Failed to send email to selected candidates. Please try again.';
        this.snackBar.open(
          message,
          '✕',
          {
            duration: 8000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      }
    );
  }

  sendEmailToMultiple() {
    const selectedCandidates = this.candidates.filter(c => c.selected);
    this.sendEmail(selectedCandidates);
  }

  sendEmailToSingle(candidate: Candidate) {
    this.sendEmail([candidate]);
  }
  
  analyzeProfiles() {
    const selectedCandidates = this.candidates.filter(c => c.selected);
    this.analyzeProfile(selectedCandidates);
  }

    analyzeProfile(candidates: Candidate[]) {
    if (!candidates || candidates.length === 0) {
      this.snackBar.open('Please select at least one candidate to analyze.', '✕', {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }
    // const req_id = candidates[0].req_id || null;
    const candidate_ids = candidates.map(c => c.id);
    // const payload = { req_id, candidate_ids };
       const payload = {candidate_ids };
    // Set analyzing state for all candidates before starting
    candidates.forEach(c => {
      c.profileAnalyzed = false;
      c.analyzing = true;
    });
    this.aiService.analyzeProfile(payload).subscribe(
      response => {
        const message = candidates.length === 1
          ? `Profile analysis completed for ${this.getCandidateName(candidates[0])}.`
          : 'Profile analysis completed for selected candidates.';
        this.snackBar.open(message, '✕', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        console.log('Analyze response:', response);
        
        // Track IDs to avoid duplicates
        const processedIds = new Set();
        
        // Assign analysis results to candidates and log all fields
        response.forEach((result: any) => {
          // Skip if we've already processed this ID
          if (processedIds.has(result.id)) {
            console.log('Skipping duplicate result for ID:', result.id);
            return;
          }
          
          // Find the candidate by ID
          const candidate = this.candidates.find(c => c.id === result.id);
          if (candidate) {
            // Update properties only (don't create new candidates)
            candidate.final_score_value = result.final_score_value;
            candidate.passing_score = result.passing_score;
            candidate.analyzing = false;
            candidate.resume_shortlist_score = result.resume_shortlist_score;
            candidate.qualification_score = result.qualification_score;
            candidate.work_exp_score = result.work_exp_score;
            candidate.skills_score = result.skills_score;
            
            // Check if the candidate should be marked as analyzed based on scores
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
              console.log(`Analysis complete for candidate ${candidate.id} with valid scores`);
            } else {
              candidate.profileAnalyzed = false;
              console.log(`Analysis complete for candidate ${candidate.id} but no valid scores found`);
            }
            
            // Mark this ID as processed
            processedIds.add(result.id);
            
            // Log updated candidate for debug
            console.log('Updated candidate:', candidate);
          }
        });
        // Log all candidates after update
        console.log('All candidates after analysis:', this.candidates);
        console.log('Total candidate count after analysis:', this.candidates.length);
      },
      error => {
        this.snackBar.open('Profile analysis failed. Please try again later.', '✕', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        // Stop spinner for all candidates attempted
        candidates.forEach(candidate => {
          candidate.analyzing = false;
        });
        console.error('Analyze error:', error);
      }
    );
  }
  
  deleteProfiles() {
    // Implement delete profiles functionality
    console.log('Deleting profiles', this.candidates.filter(c => c.selected));
    this.candidates = this.candidates.filter(c => !c.selected);
    this.selectedCount = 0;
  }

  onComplete() {
    this.proceed.emit();
  }

  toggleFilter() {
    this.filterVisible = !this.filterVisible;
    // Toggle filter options visibility when toggling filter visibility
    if (this.filterVisible) {
      // When showing filter, DON'T automatically show the filter options dropdown
      // User needs to click the + icon to see options
      this.showFilterOptions = false;
      // Don't show the second dropdown with yes/no options
      this.selectedFilterOption = null;
    } else {
      // When hiding filter, hide all dropdowns
      this.showFilterOptions = false;
      this.selectedFilterOption = null;
    }
  }

  selectFilterOption(filterType: string) {
    // Set the selected filter option and show the second dropdown
    this.selectedFilterOption = filterType;
    this.filterValue = 'yes'; // Default to 'yes'
    // Keep the initial filter dropdown open
    this.showFilterOptions = true;
  }

  getFilterDisplayName(filterType: string): string {
    switch(filterType) {
      case 'profileScore': return 'Profile Score';
      case 'profileAnalyzed': return 'Profile Analyzed';
      case 'emailSent': return 'E-mail Sent';
      default: return filterType;
    }
  }

  cancelFilter() {
    // Reset the selected filter option and hide all filter dropdowns
    this.selectedFilterOption = null;
    // Hide filter options dropdown as well
    this.showFilterOptions = false;
    // Keep the filter row visible with just the filter label and add button
    this.filterVisible = true;
  }

  applyFilter() {
    if (this.selectedFilterOption) {
      console.log(`Applying filter: ${this.selectedFilterOption} with value: ${this.filterValue}`);
      
      // Implement filtering logic based on the selected filter type and value
      // Example: Filter candidates based on selectedFilterOption and filterValue
      this.filterCandidates(this.selectedFilterOption, this.filterValue);
      
      // Close both the filter options panel and filter dropdown
      this.selectedFilterOption = null;
      this.showFilterOptions = false;
      
      // Keep the filter row visible with just the filter label and add button
      this.filterVisible = true;
    }
  }

  toggleFilterOptions() {
    // Toggle the visibility of the filter options dropdown
    this.showFilterOptions = !this.showFilterOptions;
    
    // When showing filter options, make sure the second dropdown is hidden
    if (this.showFilterOptions) {
      this.selectedFilterOption = null;
    } 
    // When hiding filter options, also hide the second dropdown
    else {
      this.selectedFilterOption = null;
    }
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Check if click is outside the filter dropdown container
    if (this.showFilterOptions || this.selectedFilterOption) {
      const filterContainer = this.elementRef.nativeElement.querySelector('.filter-dropdown-container');
      const filterLabel = this.elementRef.nativeElement.querySelector('.filter-label');
      
      if (filterContainer && filterLabel) {
        // Check if the click target is inside the filter container or filter label
        const isClickInsideFilter = 
          filterContainer.contains(event.target) || 
          filterLabel.contains(event.target);
        
        // If click is outside, close the dropdowns
        if (!isClickInsideFilter) {
          this.showFilterOptions = false;
          this.selectedFilterOption = null;
        }
      }
    }
  }
  
  // Method to filter candidates
  
  // Method to filter candidates based on filter type and value
  filterCandidates(filterType: string, filterValue: string) {
    // Add or update filter
    const existingFilterIndex = this.activeFilters.findIndex(f => f.type === filterType);
    if (existingFilterIndex !== -1) {
      // Update existing filter
      this.activeFilters[existingFilterIndex].value = filterValue;
    } else {
      // Add new filter
      this.activeFilters.push({ type: filterType, value: filterValue });
    }
    
    // Apply all active filters
    this.applyActiveFilters();
    
    console.log(`Filter applied: ${filterType} = ${filterValue}`);
    console.log(`Active filters:`, this.activeFilters);
  }
  
  // Apply all active filters to candidates
  applyActiveFilters() {
    this.filteredCandidates = [...this.candidates];
    this.activeFilters.forEach(filter => {
      switch (filter.type) {
        case 'filterKeyword':
          if (filter.value && filter.value.trim().length > 0) {
            const keyword = filter.value.trim().toLowerCase();
            this.filteredCandidates = this.filteredCandidates.filter(candidate => {
              const nameMatch = candidate.resume_rel_info?.name?.toLowerCase().includes(keyword);
              const skillMatch = candidate.resume_rel_info?.skills?.some(skill => skill.toLowerCase().includes(keyword));
              return nameMatch || skillMatch;
            });
          }
          break;
        case 'profileScoreMin':
          if (filter.value > 0) {
            this.filteredCandidates = this.filteredCandidates.filter(candidate => {
              // Check for both possible score field names and convert to number for comparison
              const finalScore = candidate.final_score_value !== undefined ? Number(candidate.final_score_value) : 0;
              const overallScore = candidate.overall_score !== undefined ? Number(candidate.overall_score) : 0;
              
              // Use whichever score is available (prefer final_score_value if both exist)
              const scoreToUse = finalScore > 0 ? finalScore : overallScore;
              
              // Only include candidates with scores meeting the minimum
              return scoreToUse >= Number(filter.value);
            });
          }
          break;
        case 'profileAnalysis':
          if (filter.value === 'done') {
            this.filteredCandidates = this.filteredCandidates.filter(candidate => candidate.profileAnalyzed === true);
          } else if (filter.value === 'notdone') {
            this.filteredCandidates = this.filteredCandidates.filter(candidate => candidate.profileAnalyzed === false);
          }
          break;
        case 'interviewScoreMin':
          if (filter.value > 0) {
            this.filteredCandidates = this.filteredCandidates.filter(candidate => {
              const interviewScore = candidate.interviewScore !== undefined ? Number(candidate.interviewScore) : 0;
              return interviewScore >= Number(filter.value);
            });
          }
          break;
        case 'interviewInviteStatus':
          if (filter.value === 'sent') {
            this.filteredCandidates = this.filteredCandidates.filter(candidate => candidate.emailSent === true);
          } else if (filter.value === 'notsent') {
            this.filteredCandidates = this.filteredCandidates.filter(candidate => candidate.emailSent === false);
          }
          break;
      }
    });
    console.log(`Filtered candidates count: ${this.filteredCandidates.length}`);
  }
  
  // Remove a filter by type
  removeFilter(filterType: string) {
    // Remove the filter from active filters
    this.activeFilters = this.activeFilters.filter(filter => filter.type !== filterType);
    
    // Re-apply remaining filters
    this.applyActiveFilters();
    
    // If no filters remain, hide the filter row if desired
    if (this.activeFilters.length === 0) {
      // Optionally reset filter view
      // this.filterVisible = false;
    }
  }

  // Toggle filter card visibility
  // ...existing code...
  analyzeProfileToSingle(candidate: Candidate) {
  candidate.analyzing = true;
  this.analyzeProfile([candidate]);
  }

  // Helper to get candidate name safely
  getCandidateName(candidate: Candidate): string {
    return candidate.resume_rel_info?.name || '';
  }

  resetFilter(): void {
    this.filterKeyword = '';
    this.filteredCandidates = [...this.candidates];
    this.activeFilters = [];
  }
}
