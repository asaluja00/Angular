import { Component, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AiService } from '../services/ai.service';
import { ConfirmProceedDialogComponent } from '../dialogs/confirm-proceed-dialog/confirm-proceed-dialog.component';
// removed incorrect Node 'console' import; use browser console directly (console.log)

@Component({
    selector: 'app-add-requirements-job-details',
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule
    ],
    templateUrl: './add-requirements-job-details.component.html',
    styleUrl: './add-requirements-job-details.component.scss'
})
export class AddRequirementsJobDetailsComponent implements OnInit {
  private dialog = inject(MatDialog);
  // Controls read-only/greyed-out state for closed requirements
  @Input() isReadOnly: boolean = false;

  @Output() proceed = new EventEmitter<string>(); // emit req_id
  private router = inject(Router);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private aiservice = inject(AiService);
  private route = inject(ActivatedRoute);
  
  // Controls loading state during form submission
  isSubmitting: boolean = false;
  
  // Track form state for edit mode
  private initialFormState: string = '';
  isFormDirty: boolean = false;
  isFormChanged: boolean = false;
  originalFormData: any = null; // To store original form data for comparison - must be public for template access
  isEditMode: boolean = false;
  currentReqId: string | null = null;
 resumeUploadCount: number = 0;
 empId: string = '';
private aiService = inject(AiService);

ngOnInit() {
 
    // Get requirementId from route params
    this.route.params.subscribe(params => {
      const requirementId = params['reqId'] || params['id'];
         this.route.queryParams.subscribe(qparams => {
      this.resumeUploadCount = +qparams['resumeCount'] || 0;
      // ...existing code to load requirement details...
    });
      this.aiService.empId$.subscribe(id=>{
      this.empId=id;
      console.log("employeeId in add requirements",this.empId);
      
    })
      if (requirementId) {
        this.isEditMode = true;
        this.currentReqId = requirementId;
        this.aiservice.getRequirementDetails({ req_id: requirementId }).subscribe({
          next: (response) => {

            // Map API response to form model
            this.requirementData.title = response.requirement_title || '';
            this.requirementData.description = response.job_description || '';
            this.requirementData.jobRole = response.job_role || '';
            this.requirementData.resumeShortlistPercentage = response.resume_shortlisting_percent || null;
            this.requirementData.interviewPassPercentage = response.interview_passing_percent || null;
            this.requirementData.jobDescription = response.job_description || '';
            this.requirementData.rolesAndResponsibilities = response.roles_responsiblities || '';
            this.requirementData.experience = response.work_experience || null;
            this.requirementData.mandatorySkills = response.mandatory_skills || '';
            this.requirementData.optionalSkills = response.optional_skill || '';
            this.requirementData.education = response.education || '';
            this.requirementData.certifications = '';

            // Map weightage fields from response.weights if present
            if (response.weights && typeof response.weights === 'object') {
              const weights = response.weights;
              this.requirementData.experienceWeightage = weights['Work Experience'] ?? weights['Experience Weightage'] ?? null;
              this.requirementData.mandatorySkillsWeightage = weights['Mandatory Skills'] ?? weights['Mandatory Skills Weightage'] ?? null;
              this.requirementData.optionalSkillsWeightage = weights['Optional Skills'] ?? weights['Optional Skills Weightage'] ?? null;
              this.requirementData.educationWeightage = weights['Education'] ?? weights['Education Weightage'] ?? null;
              this.requirementData.certificationsWeightage = weights['Certifications'] ?? weights['Certification Weightage'] ?? null;
            } else {
              this.requirementData.experienceWeightage = null;
              this.requirementData.mandatorySkillsWeightage = null;
              this.requirementData.optionalSkillsWeightage = null;
              this.requirementData.educationWeightage = null;
              this.requirementData.certificationsWeightage = null;
            }
            
            // Save initial state for dirty checking after loading data
            setTimeout(() => {
              this.resetFormDirtyState();
             
            });
          },
          error: (err) => {
      
          }
        });
      } else {
        this.isEditMode = false;
        this.currentReqId = null;
      }
    });
  }
  // Helper to check if form should be editable
get isFormEditable(): boolean {
  return this.resumeUploadCount === 0;
}

  isExperienceValid(): boolean {
    const exp = this.requirementData.experience;
    // Covers: null, undefined, NaN, zero, negative
    if (exp === null || exp === undefined) return false;
    if (typeof exp === 'number') {
      if (isNaN(exp) || exp < 0) return false;
      return true;
    }
    return false;
  }

  /**
   * Called whenever a form field changes via input event
   * Sets isFormChanged flag to enable the save button in edit mode
   */
  onFormChange() {
    try {
      // Always check for changes when a field changes
      const hasChanges = this.checkFormChanges();
      
      // Update both flags to ensure consistency
      this.isFormChanged = hasChanges;
      this.isFormDirty = hasChanges;
      
      // Force Angular change detection by setting a timeout
      setTimeout(() => {
        // This empty timeout ensures Angular's change detection runs
        // after our flags have been updated
      }, 0);
    } catch (error) {

      // Default to true to allow saving in case of error
      this.isFormChanged = true;
      this.isFormDirty = true;
    }
  }

  /**
   * Compares current form data with original data to check if form has changed
   * Uses field-by-field comparison with string normalization for more reliable detection
   * @returns boolean indicating if form has changed
   */
  checkFormChanges(): boolean {
    if (!this.originalFormData) return false;

    const fields: Array<keyof typeof this.requirementData> = [
      'title', 'description', 'jobRole', 'resumeShortlistPercentage',
      'interviewPassPercentage', 'jobDescription', 'rolesAndResponsibilities',
      'experience', 'experienceWeightage', 'mandatorySkills', 'mandatorySkillsWeightage',
      'optionalSkills', 'optionalSkillsWeightage', 'education', 'educationWeightage',
      'certifications', 'certificationsWeightage'
    ];

    try {
      for (const key of fields) {
        const initialValue = this.originalFormData[key];
        const currentValue = this.requirementData[key];

        // Normalize both values to strings, treating null/undefined as empty string
        const initialValueStr = (initialValue === null || initialValue === undefined) ? '' : String(initialValue).trim().toLowerCase();
        const currentValueStr = (currentValue === null || currentValue === undefined) ? '' : String(currentValue).trim().toLowerCase();

        // If either value is empty and the other is not, it's a change
        if (initialValueStr !== currentValueStr) {
          // For debugging

          return true;
        }
      }
      return false;
    } catch (error) {
      
      return false;
    }
  }
  
  /**
   * Reset the form state tracking and store original form data
   * Used for detecting changes in edit mode
   */
  resetFormDirtyState(): void {
    this.isFormDirty = false;
    this.isFormChanged = false;
    this.initialFormState = JSON.stringify(this.requirementData);
    
    // Create a deep copy of the form data to use for field-by-field comparison
    this.originalFormData = JSON.parse(JSON.stringify(this.requirementData));
  
    
    // Debug current form state
    // this.debugFormState();
  }
  

  // Define the model for the form data
  requirementData: {
    title: string;
    description: string;
    jobRole: string;
    resumeShortlistPercentage: number | null;
    interviewPassPercentage: number | null;
    jobDescription: string;
    rolesAndResponsibilities: string;
    experience: number | null;
    experienceWeightage: number | null;
    mandatorySkills: string;
    mandatorySkillsWeightage: number | null;
    optionalSkills: string;
    optionalSkillsWeightage: number | null;
    education: string;
    educationWeightage: number | null;
    certifications: string;
    certificationsWeightage: number | null;
  } = {
    title: '',
    description: '',
    jobRole: '',
    resumeShortlistPercentage: null,
    interviewPassPercentage: null,
    jobDescription: '',
    rolesAndResponsibilities: '',
    experience: null,
    experienceWeightage: null,
    mandatorySkills: '',
    mandatorySkillsWeightage: null,
    optionalSkills: '',
    optionalSkillsWeightage: null,
    education: '',
    educationWeightage: null,
    certifications: '',
    certificationsWeightage: null
  };
 
  onSubmit(form: NgForm) {
    if (form.valid) {
      // Sanitize experience field before sending
      if (typeof this.requirementData.experience === 'string') {
        // Remove everything after first newline
        const firstLine = (this.requirementData.experience as string).split('\n')[0].trim();
        // If firstLine is not a valid number, set experience to null
        if (!/^[0-9]+(\.[0-9]+)?$/.test(firstLine)) {
          this.requirementData.experience = null;
        } else {
          this.requirementData.experience = Number(firstLine);
        }
      }

      // Open confirmation dialog before API call
      const dialogRef = this.dialog.open(ConfirmProceedDialogComponent, {
        width: '400px',
        data: { message: 'Are you sure you want to save and proceed?' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          // Set loading state to true
          this.isSubmitting = true;
          
          // Show loading snackbar
          this.snackBar.open('Saving requirement details...', '', {
            duration: 0, // Don't auto-dismiss
            verticalPosition: 'top'
          });
          
          // Only call API if user confirms
          // If in edit mode, include the requirement ID in the payload
          let apiPayload = { ...this.requirementData };
          if (this.isEditMode && this.currentReqId) {
            (apiPayload as any).req_id = this.currentReqId;
          }
          // this.aiservice.addRequirementDetails(apiPayload)
          this.aiservice.addRequirementDetails({ ...apiPayload, employeeId: this.empId })
            .subscribe({
              next: (response) => {
               
                const reqId = response?.req_id;
                if (!reqId) {
                  
                }
                
                // Reset loading state
                this.isSubmitting = false;
                
                // Dismiss loading snackbar
                this.snackBar.dismiss();
                
                // Reset form state tracking with new data after successful save
                this.resetFormDirtyState();
                
                this.proceed.emit(reqId);
              },
              error: (error) => {
             
                
                // Reset loading state
                this.isSubmitting = false;
                
                // Dismiss loading snackbar
                this.snackBar.dismiss();
                
                // Show error message
                this.snackBar.open('Error saving requirement details!', 'Close', {
                  duration: 5000,
                  verticalPosition: 'top',
                  panelClass: ['error-snackbar']
                });
              }
            });
        }
        // If cancelled, do nothing (dialog closes automatically)
      });
    } else {
      
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsTouched();
      });
    }
  }
   
   /**
    * Creates and triggers a file input element to upload Excel templates
    * and sends the whole template to the backend for processing
    */
   uploadTemplate() {
     // Create a file input element
     const fileInput = document.createElement('input');
     fileInput.type = 'file';
     fileInput.accept = '.xlsx, .xls, .csv';
     fileInput.style.display = 'none';
     
     // Add it to the DOM
     document.body.appendChild(fileInput);
     
     // Add event listener for when a file is selected
     fileInput.addEventListener('change', (event) => {
       const target = event.target as HTMLInputElement;
       if (target.files && target.files.length > 0) {
         const file = target.files[0];
       
         
         // Create FormData and send the whole template to the backend
         const formData = new FormData();
         formData.append('template', file);
         
         // Show loading indicator
         this.snackBar.open('Uploading template...', '', {
           duration: 5000,
           verticalPosition: 'top'
         });
         
         // Send the file to the backend for processing using the service
         this.aiservice.uploadRequirementTemplate(file)
           .subscribe({
             next: (event: any) => {
               // Handle different types of HTTP events
               if (event.type === HttpEventType.Response) {
              
                 this.snackBar.dismiss();
                 this.snackBar.open('Template uploaded successfully!', 'Close', {
                   duration: 3000,
                   verticalPosition: 'top'
                 });
                 
                 // Parse the response text using the service helper method
                 if (event.body && typeof event.body === 'string') {
                   try {
                     const parsedResponse = this.aiservice.processJsonResponse(event.body);
                    
                     this.prefillFormFromResponse(parsedResponse);
                   } catch (error) {
                     
                   }
                 }
               } else if (event.type === HttpEventType.UploadProgress) {
                 const percentDone = Math.round(100 * event.loaded / (event.total || 1));
                 
                 // Optional: Update progress indicator
               }
             },
             error: (error) => {
            
               // Log more details about the error for debugging
               if (error.status) {

               }
               if (error.error) {
              
               }
               
               this.snackBar.dismiss();
               this.snackBar.open(`Error uploading template (${error.status || 'Network error'}). Please try again.`, 'Close', {
                 duration: 5000,
                 verticalPosition: 'top'
               });
             }
           });
       }
       
       // Clean up
       document.body.removeChild(fileInput);
     });
     
     // Trigger click to open file selector
     fileInput.click();
   }
   
 
  
  
   /**
    * Prefills the form with data received from the backend after template upload
    */
   prefillFormFromResponse(response: any) {
    if (!response) return;

    const normalize = (val: any) => {
      if (typeof val !== 'string') return val;
      const v = val.trim().toLowerCase();
      return (v === 'na' || v === 'n/a' || v === 'nan') ? '' : val.trim();
    };
    try {
      // Handle structured response with text and weights
      if (response.text && typeof response.text === 'string') {
        const textContent = response.text;
        const jobRoleMatch = textContent.match(/Job Role - (.*?)(?:\n|$)/);
        if (jobRoleMatch && jobRoleMatch[1]) {
          this.requirementData.jobRole = normalize(jobRoleMatch[1]);
        }
        const jobDescMatch = textContent.match(/Job Description - (.*?)(?=\n[A-Za-z]+ - |\n$)/s);
        if (jobDescMatch && jobDescMatch[1]) {
          this.requirementData.jobDescription = normalize(jobDescMatch[1]);
        }
        const rolesMatch = textContent.match(/Roles and Responsibilities - (.*?)(?=\n[A-Za-z]+ - |\n$)/s);
        if (rolesMatch && rolesMatch[1]) {
          this.requirementData.rolesAndResponsibilities = normalize(rolesMatch[1]);
        }
        const expMatch = textContent.match(/Work Experience - (.*?)(?=\n[A-Za-z]+ - |\n$)/s);
        if (expMatch && expMatch[1]) {
          this.requirementData.experience = normalize(expMatch[1]);
        }
        const mandSkillsMatch = textContent.match(/Mandatory Skills - (.*?)(?=\n[A-Za-z]+ - |\n$)/s);
        if (mandSkillsMatch && mandSkillsMatch[1]) {
          this.requirementData.mandatorySkills = normalize(mandSkillsMatch[1]);
        }
        const optSkillsMatch = textContent.match(/Optional Skills - (.*?)(?=\n[A-Za-z]+ - |\n$)/s);
        if (optSkillsMatch && optSkillsMatch[1]) {
          this.requirementData.optionalSkills = normalize(optSkillsMatch[1]);
        }
        const eduMatch = textContent.match(/Education - (.*?)(?=\n[A-Za-z]+ - |\n$)/s);
        if (eduMatch && eduMatch[1]) {
          this.requirementData.education = normalize(eduMatch[1]);
        }
        const certMatch = textContent.match(/Certifications - (.*?)(?=\n[A-Za-z]+ - |\n$|$)/s);
        if (certMatch && certMatch[1]) {
          this.requirementData.certifications = normalize(certMatch[1]);
        }
      }
      if (response.passing_score !== undefined) {
        this.requirementData.interviewPassPercentage = response.passing_score;
      }
      if (response.resume_shortlist_score !== undefined) {
        this.requirementData.resumeShortlistPercentage = response.resume_shortlist_score;
      }
      if (response.weights && typeof response.weights === 'object') {
        const weights = response.weights;
        if (!isNaN(weights['Work Experience'])) {
          this.requirementData.experienceWeightage = weights['Work Experience'];
        }
        if (!isNaN(weights['Mandatory Skills'])) {
          this.requirementData.mandatorySkillsWeightage = weights['Mandatory Skills'];
        }
        if (!isNaN(weights['Optional Skills'])) {
          this.requirementData.optionalSkillsWeightage = weights['Optional Skills'];
        }
        if (!isNaN(weights['Education'])) {
          this.requirementData.educationWeightage = weights['Education'];
        }
        if (!isNaN(weights['Certifications']) && weights['Certifications'] !== null) {
          this.requirementData.certificationsWeightage = weights['Certifications'];
        }
      }
      for (const key of Object.keys(this.requirementData)) {
        if (response[key] !== undefined && response[key] !== null) {
          (this.requirementData as any)[key] = normalize(response[key]);
        }
      }
    } catch (error) {
    
    }
    
  }
  /**
   * Checks if any required field contains NA/N/A/nan or is empty
   */
  get hasInvalidRequiredFields(): boolean {
    const requiredFields = [
      'title', 'jobRole', 'jobDescription', 'rolesAndResponsibilities',
      'experience', 'mandatorySkills', 'education'
    ];
    for (const key of requiredFields) {
      const val = (this.requirementData as any)[key];
      if (val === null || val === undefined) return true;
      if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        if (!v || v === 'na' || v === 'n/a' || v === 'nan') return true;
      }
      if (key === 'experience' && (isNaN(Number(val)) || Number(val) < 0)) return true;
    }
    return false;
  }
   
   
   private prefillFormFields(fieldMappings: {[key: string]: any}, weightMappings?: {[key: string]: any}) {
     // Define mapping between Excel field names and form field names
     type RequirementDataKey = keyof typeof this.requirementData;
     const mappings: {[key: string]: RequirementDataKey} = {
       'Job Title': 'title',
       'Requirement Title': 'title',
       'Title': 'title',
       'Description': 'description',
       'Requirement Description': 'description',
       'Job Role': 'jobRole',
       'Role': 'jobRole',
       'Position': 'jobRole',
       'Resume Shortlist Percentage': 'resumeShortlistPercentage',
       'Interview Pass Percentage': 'interviewPassPercentage',
       'Job Description': 'jobDescription',
       'Roles and Responsibilities': 'rolesAndResponsibilities',
       'Work Experience': 'experience',
       'Experience': 'experience',
       'Experience Weightage': 'experienceWeightage',
       'Mandatory Skills': 'mandatorySkills',
       'Required Skills': 'mandatorySkills',
       'Mandatory Skills Weightage': 'mandatorySkillsWeightage',
       'Optional Skills': 'optionalSkills',
       'Nice to Have Skills': 'optionalSkills',
       'Optional Skills Weightage': 'optionalSkillsWeightage',
       'Education': 'education',
       'Education Requirements': 'education',
       'Education Weightage': 'educationWeightage',
       'Certifications': 'certifications',
       'Required Certifications': 'certifications',
       'Certifications Weightage': 'certificationsWeightage',
     };
     
     // Iterate through the field mappings and set form values
     for (const [excelField, value] of Object.entries(fieldMappings)) {
       // Check if this Excel field has a mapping to our form
       const formField = mappings[excelField];
       if (formField) {
         // Set the value in the form
         (this.requirementData as any)[formField] = value;
       }
     }
     
     // Process weightage values from column C if provided
     if (weightMappings) {
       // Map for weightage fields
       const weightageFieldMap: {[key: string]: RequirementDataKey} = {
         'Experience': 'experienceWeightage',
         'Mandatory Skills': 'mandatorySkillsWeightage',
         'Optional Skills': 'optionalSkillsWeightage',
         'Education': 'educationWeightage',
         'Certifications': 'certificationsWeightage',
       };
       
       for (const [excelField, value] of Object.entries(weightMappings)) {
         const weightageField = weightageFieldMap[excelField];
         if (weightageField) {
           (this.requirementData as any)[weightageField] = value;
         }
       }
     }
   }
   
  
}
