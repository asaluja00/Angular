import { Component, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
// import { UploadOptionsDialogComponent } from './upload-options-dialog/upload-options-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AiService } from '../services/ai.service';
import { ENCRYPTION_KEY } from '../services/ai.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
// removed incorrect Node 'console' import; use browser console directly (console.log)

interface HTMLInputElementWithDirectory extends HTMLInputElement {
  webkitdirectory: boolean;
  directory: boolean;
}

@Component({
    selector: 'app-upload-resumes',
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatSnackBarModule,
        MatProgressBarModule,
        CommonModule
    ],
    templateUrl: './upload-resumes.component.html',
    styleUrl: './upload-resumes.component.scss'
})
export class UploadResumesComponent {
  /**
   * Returns true if any selected file is uploading
   */
  anySelectedFileUploading(): boolean {
    return this.selectedFiles.some(file => this.getFileUploadStatus(file).isUploading);
  }
  /**
   * Returns true if all selected files are uploaded (completed)
   */
  allSelectedFilesUploaded(): boolean {
    return this.selectedFiles.length > 0 && this.selectedFiles.every(file => this.getFileUploadStatus(file).completed);
  }
  @Input() requirementId: string = '';
  @Output() proceed = new EventEmitter<any>();
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('folderInput') folderInput!: ElementRef;
  
  selectedFiles: File[] = [];
  uploadedFiles: File[] = []; // Store files that have been successfully uploaded
  uploadedFolders: Map<string, File[]> = new Map();
  fileError: string | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  uploadCompleted: boolean = false; // Track if upload has completed successfully
  isSavingAndProceeding: boolean = false; // For indeterminate progress bar
  isProcessingCompleted: boolean = false;
  
  // Track upload progress for individual files
  fileUploadStatus: Map<string, {isUploading: boolean, progress: number, completed: boolean}> = new Map();
  
  // For template access
  Math = Math;

  // New properties for segmented progress indicator
  segmentActiveIndex: number = 0;
  segmentInterval: any;

  constructor(
    private dialog: MatDialog, 
    private snackBar: MatSnackBar,
    private aiService: AiService
  ) {}

  onSaveAndProceed() {

    this.isSavingAndProceeding = true;
    this.segmentActiveIndex = 0;
    if (this.segmentInterval) {
      clearInterval(this.segmentInterval);
    }
    this.segmentInterval = setInterval(() => {
      this.segmentActiveIndex = (this.segmentActiveIndex + 1) % 5;
    }, 400);
    // ...existing code...
    if (this.isUploading) {
      this.snackBar.open('Please wait for uploads to complete', 'Close', { duration: 3000 });
      this.isSavingAndProceeding = false;
      return;
    }
    if (this.selectedFiles.length > 0) {
      this.uploadFiles();
    } else {
      this.isSavingAndProceeding = false;
      // ...existing code...
    }
  }

  /**
   * Prepares FormData with files and metadata in a unified way
   */
  private prepareFormData(): FormData {
    const formData = new FormData();
    // Encrypt requirementId before appending
    let encryptedRequirementId = this.requirementId;
    if (this.requirementId && this.aiService.encryptWithDynamicIv) {
      try {
        encryptedRequirementId = this.aiService.encryptWithDynamicIv(this.requirementId, ENCRYPTION_KEY);
      } catch (e) {
        // fallback to plain if encryption fails
        encryptedRequirementId = this.requirementId;
        console.log("encrypted id............", encryptedRequirementId);
        
      }
    }
    formData.append('requirementId', encryptedRequirementId);
    // Create a unified array to store all files (from individual uploads and folders)
    const allFiles: Array<{
      file: File;
      path: string;
      folderName?: string;
    }> = [];
    
    // 1. Add individual files
    this.selectedFiles.forEach(file => {
      if (!this.isFolder(file) && !file.webkitRelativePath) {
        allFiles.push({
          file: file,
          path: file.name
        });
      }
    });
    
    // 2. Add folder files
    if (this.uploadedFolders.size > 0) {
      this.uploadedFolders.forEach((folderFiles, folderName) => {
       
        
        folderFiles.forEach(file => {
          allFiles.push({
            file: file,
            path: `${folderName}/${file.name}`,
            folderName: folderName
          });
        });
      });
    }
    
    // Process all files in a uniform way
  
    
    // Create an array to store metadata for all files
    const filesMetadata = allFiles.map((item, index) => {
      const { file, path, folderName } = item;
      
      // Append the file to formData with its path
      formData.append('resumes', file, path);
      
      // Return metadata for this file
      return {
        name: file.name,
        path: path,
        isInFolder: !!folderName,
        folderName: folderName || null,
        size: file.size,
        index: index
      };
    });
    
    // Add all file metadata as a single JSON object
    formData.append('filesMetadata', JSON.stringify(filesMetadata));
   
    
    return formData;
  }

  /**
   * Upload the selected files to the server
   */
  private uploadFiles() {
  
    this.isUploading = true;
    this.uploadProgress = 0;
    this.isSavingAndProceeding = true;
    const formData = this.prepareFormData();
    this.aiService.uploadResumes(formData)
    .pipe(
      finalize(() => {
      
        this.isSavingAndProceeding = false;
        if (this.segmentInterval) {
          clearInterval(this.segmentInterval);
        }
        this.segmentActiveIndex = 0;
      })
    )
    .subscribe({
      next: (event: any) => {
       
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round((100 * event.loaded) / (event.total || 100));
         
        } else if (event instanceof HttpResponse) {
         
          this.isUploading = false;
          this.uploadProgress = 100;
          this.uploadCompleted = true;
          // this.moveFilesAndProceed(event.body);
          // new code
            // Instead of moveFilesAndProceed, call getAnalysisDetails here
          if (this.requirementId) {
            setTimeout(() => {
              this.aiService.getAnalysisDetails({ req_id: this.requirementId }).subscribe({
                next: (response: any) => {
                  let candidatesData = null;
                  if (response && response.data) {
                    candidatesData = response.data;
                  } else if (response && Array.isArray(response)) {
                    candidatesData = response;
                  } else if (response && response.candidates) {
                    candidatesData = response.candidates;
                  } else if (response && response.result && response.result.data) {
                    candidatesData = response.result.data;
                  } else if (response && response.result && Array.isArray(response.result)) {
                    candidatesData = response.result;
                  } else if (response && typeof response === 'object') {
                    const potentialArrays = Object.values(response).filter(val => Array.isArray(val));
                    if (potentialArrays.length > 0) {
                      candidatesData = potentialArrays[0];
                    }
                  }
                  this.proceed.emit(candidatesData || []);
                },
                error: (err) => {
                  // Fallback: emit only the newly uploaded candidates if fetch fails
                  let safeCandidates: any[] = [];
                  if (Array.isArray(event.body) && event.body.length > 0) {
                    safeCandidates = event.body.map((c: any, idx: number) => ({
                      ...c,
                      name: typeof c.name === 'string' ? c.name : `Candidate ${idx + 1}`,
                      initials: typeof c.initials === 'string' ? c.initials : (typeof c.name === 'string' ? c.name.charAt(0) : `C${idx + 1}`),
                      position: typeof c.position === 'string' ? c.position : '',
                    }));
                  } else {
                    safeCandidates = [
                      { name: 'Candidate 1', initials: 'C', position: 'Unknown' }
                    ];
                  }
                  this.proceed.emit(safeCandidates);
                }
              });
            }, 3000); // 3 seconds delay after upload
          } else {
            // Fallback: emit only the newly uploaded candidates if no requirementId
            let safeCandidates: any[] = [];
            if (Array.isArray(event.body) && event.body.length > 0) {
              safeCandidates = event.body.map((c: any, idx: number) => ({
                ...c,
                name: typeof c.name === 'string' ? c.name : `Candidate ${idx + 1}`,
                initials: typeof c.initials === 'string' ? c.initials : (typeof c.name === 'string' ? c.name.charAt(0) : `C${idx + 1}`),
                position: typeof c.position === 'string' ? c.position : '',
              }));
            } else {
              safeCandidates = [
                { name: 'Candidate 1', initials: 'C', position: 'Unknown' }
              ];
            }
            this.proceed.emit(safeCandidates);
          }
        }
      },
      error: (err) => {
        
        this.snackBar.open(`Error uploading files: ${err.message || 'Unknown error'}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.moveFilesAndProceed([]);
      },
      complete: () => {
     
        if (!this.uploadCompleted) {
          this.moveFilesAndProceed([]);
        }
      }
    });
  }

  showUploadOptions() {
    // Use the existing fileInput element instead of creating a new one
    // This will prevent the browser alert from showing
    this.fileInput.nativeElement.click();
  }
  
  /**
   * Helper method to move files from selectedFiles to uploadedFiles
   * and emit the proceed event to navigate to the next step
   */
  private moveFilesAndProceed(candidatesData: any = []) {
    // Move all files from selectedFiles to uploadedFiles
    for (const file of this.selectedFiles) {
      this.uploadedFiles.push(file);
    }
    this.selectedFiles = [];

    // Defensive: Ensure candidatesData is an array of objects with required properties
    let safeCandidates: any[] = [];
    if (Array.isArray(candidatesData) && candidatesData.length > 0) {
      safeCandidates = candidatesData.map((c: any, idx: number) => ({
        ...c,
        name: typeof c.name === 'string' ? c.name : `Candidate ${idx + 1}`,
        initials: typeof c.initials === 'string' ? c.initials : (typeof c.name === 'string' ? c.name.charAt(0) : `C${idx + 1}`),
        position: typeof c.position === 'string' ? c.position : '',
      }));
    } else {
      // Fallback: emit dummy candidates if response is empty or invalid
      safeCandidates = [
        { name: 'Candidate 1', initials: 'C', position: 'Unknown' }
      ];
    }
    // Show processing completed message for 1.5s before emitting to parent
    this.isSavingAndProceeding = false;
    this.isProcessingCompleted = true;
    setTimeout(() => {
      this.isProcessingCompleted = false;
      this.proceed.emit(safeCandidates);
    }, 1500);
    // Show a confirmation message
    // this.snackBar.open('Files uploaded and saved successfully!', 'Close', { duration: 3000 });
  }
  
  selectFolder() {
    this.folderInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const files = event.target.files;
   
    
    this.fileError = null;
    
    // Create a temporary array to store valid files
    const validFiles: File[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!['doc', 'docx', 'pdf'].includes(fileExt)) {
        this.fileError = 'Only .doc, .docx, and .pdf files are allowed';
        this.selectedFiles = []; // Clear any existing files
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File size should not exceed 5MB';
        this.selectedFiles = []; // Clear any existing files
        return;
      }
      validFiles.push(file);
    }
    
    // Only add valid files to the selectedFiles array if there are no errors
    if (!this.fileError) {
      // Add files to selectedFiles and initialize their upload status
      validFiles.forEach(file => {
        this.selectedFiles.push(file);
        
        // Create a unique key for the file
        const fileKey = `${file.name}_${new Date().getTime()}`;
        
        // Set initial upload status for this file
        this.fileUploadStatus.set(fileKey, {
          isUploading: true,
          progress: 0,
          completed: false
        });
        
        // Simulate progress for this specific file
        this.simulateProgressForFile(fileKey);
      });
    }
  }
  
  /**
   * Simulate upload progress for a specific file
   */
  private simulateProgressForFile(fileKey: string) {
    const interval = setInterval(() => {
      const status = this.fileUploadStatus.get(fileKey);
      if (status) {
        status.progress += 5;
        
        if (status.progress >= 100) {
          clearInterval(interval);
          status.isUploading = false;
          status.completed = true;
          this.uploadCompleted = true; // Set global completion flag for check icon
          this.fileUploadStatus.set(fileKey, status);
        } else {
          this.fileUploadStatus.set(fileKey, status);
        }
      }
    }, 100);
  }

  onFolderSelected(event: any) {
    const files = event.target.files;
    this.fileError = null;
    
    if (files.length === 0) {
      return;
    }
    
    // Group files by folder
    const folderMap = new Map<string, File[]>();
    let hasInvalidFile = false;
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!['doc', 'docx', 'pdf'].includes(fileExt)) {
        this.fileError = 'Only .doc, .docx, and .pdf files are allowed';
        hasInvalidFile = true;
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File size should not exceed 5MB';
        hasInvalidFile = true;
        break;
      }
      
      // Get folder path from file path
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
      if (pathParts.length > 1) {
        const folderName = pathParts[0];
        
        // Add file to folder map
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, []);
        }
        folderMap.get(folderName)?.push(file);
      } else if (!file.webkitRelativePath) {
        // Only add individual files if they're not part of a folder upload
        this.selectedFiles.push(file);
      }
    }
    
    // If there are invalid files, clear selectedFiles and don't process folders
    if (hasInvalidFile) {
      this.selectedFiles = [];
      return;
    }
    
    // Create folder representations in selectedFiles
    folderMap.forEach((folderFiles, folderName) => {
      // Create a "folder" File object
      const folderBlob = new Blob([], { type: 'application/folder' });
      const folderFile = new File([folderBlob], folderName, { type: 'application/folder' });
      
      // Store folder files in map for reference
      this.uploadedFolders.set(folderName, folderFiles);
      
      // Add folder to selectedFiles with its own progress tracking
      this.selectedFiles.push(folderFile);
      
      // Create a unique key for the folder
      const folderKey = `folder_${folderName}_${new Date().getTime()}`;
      
      // Set initial upload status for this folder
      this.fileUploadStatus.set(folderKey, {
        isUploading: true,
        progress: 0,
        completed: false
      });
      
      // Simulate progress for this specific folder
      this.simulateProgressForFile(folderKey);
    });
  }

  private isValidFileType(file: File): boolean {
    const validTypes = [
      'application/msword',                                                    // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf'                                                        // .pdf
    ];
    return validTypes.includes(file.type);
  }

  /**
   * Format file size in KB or MB
   */
  getFileSize(file: File): string {
    // Check if it's a folder by name since type might be inconsistent across browsers
    if (this.isFolder(file)) {
      // For folders, show the number of files inside
      const folderFiles = this.uploadedFolders.get(file.name) || [];
      return `${folderFiles.length} file(s)`;
    }
    
    const sizeInKB = file.size / 1024;
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    } else {
      const sizeInMB = sizeInKB / 1024;
      return `${sizeInMB.toFixed(1)} MB`;
    }
  }
  
  /**
   * Check if a file is actually a folder representation
   */
  isFolder(file: File): boolean {
    // Check both the custom type and if it exists in our folders map
    return file.type === 'application/folder' || this.uploadedFolders.has(file.name);
  }
  
  /**
   * Check if a file has been uploaded completely
   */
  isFileUploaded(file: File): boolean {
    // We can consider a file uploaded if it's not uploading
    // and the upload progress is complete (100%)
    return !this.isUploading && this.uploadProgress === 100;
  }
  
 
  
  /**
   * Get current date formatted as a string
   */
  getCurrentDate(): string {
    const now = new Date();
    return `${now.getDate()} ${this.getMonthName(now.getMonth())} ${now.getFullYear()} at ${this.formatTime(now)}`;
  }
  
  /**
   * Get month name from month index
   */
  private getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  }
  
  /**
   * Format time as HH:MM AM/PM
   */
  private formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert hours from 24-hour format to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    // Add leading zero to minutes if needed
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  }


 

  /**
   * Gets formatted date and time string in the format "DD Month YYYY at h:mm AM/PM"
   * @returns The current date formatted as specified
   */
  /**
   * Delete a file from the selectedFiles array
   * @param file The file to delete
   */
  deleteFile(file: File): void {
    // Find the index of the file in the selectedFiles array
    const index = this.selectedFiles.indexOf(file);
    
    // If the file is found, remove it from the array
    if (index !== -1) {
      this.selectedFiles.splice(index, 1);
      
      // If it's a folder file, also remove related files from uploadedFolders map
      if (this.isFolder(file)) {
        const folderPath = file.webkitRelativePath?.split('/')[0] || '';
        if (folderPath && this.uploadedFolders.has(folderPath)) {
          this.uploadedFolders.delete(folderPath);
        }
      }
      
      // Show a confirmation message
      // this.snackBar.open(`${file.name} has been removed`, 'Close', { duration: 3000 });
    }
  }

  /**
   * Gets upload status for a specific file
   * @param file The file to get status for
   * @returns Upload status object
   */
  getFileUploadStatus(file: File): {isUploading: boolean, progress: number, completed: boolean} {
    // Create a key pattern similar to how we store it
    // Try to find the status using the file name
    for (const [key, status] of this.fileUploadStatus.entries()) {
      if (key.startsWith(`${file.name}_`) || key.startsWith(`folder_${file.name}_`)) {
        return status;
      }
    }
    
    // If not found, return a default status using the global state
    // but ensure completion status is more accurately tracked
    return {
      isUploading: this.isUploading,
      progress: this.uploadProgress,
      completed: this.uploadProgress >= 100
    };
  }
  
  /**
   * Gets formatted date and time string in the format "DD Month YYYY at h:mm AM/PM"
   * @returns The current date formatted as specified
   */
  getFormattedDateTime(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
  }
}
