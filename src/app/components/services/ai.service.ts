import { inject, Injectable } from '@angular/core';
export const ENCRYPTION_KEY = 'AI_Interviewer_KEY12345';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environment/environment';
import { Config } from '../utils/config';
import * as CryptoJS from 'crypto-js';


@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly aesKey = 'AI_Interviewer_KEY12345';

  /**
   * Encrypts a string using AES CBC with a random IV and returns base64 (IV + ciphertext)
   * to match backend encryption logic.
   * @param plainText - The string to encrypt
   * @param key - The encryption key
   * @returns Base64 encoded string (IV + ciphertext)
   */
  encryptWithDynamicIv(plainText: string, key: string): string {
    if (!plainText) return '';
    // Generate a random 16-byte IV
    const iv = CryptoJS.lib.WordArray.random(16);
    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(plainText, CryptoJS.enc.Utf8.parse(key.padEnd(32, '0').slice(0, 32)), {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    // Concatenate IV + ciphertext
    const ivAndCiphertext = iv.concat(encrypted.ciphertext);
    // Encode as base64
    return CryptoJS.enc.Base64.stringify(ivAndCiphertext);
  }

    decryptResponseWithDynamicIv(encrypted: string, key: string): string {
    if (!encrypted) return '';
    // Decode base64
    const encryptedBytes = CryptoJS.enc.Base64.parse(encrypted);
    // Extract IV (first 16 bytes = 4 words)
    const iv = CryptoJS.lib.WordArray.create(
      encryptedBytes.words.slice(0, 4), // 4 words * 4 bytes = 16 bytes
      16
    );
    // Extract ciphertext (after IV)
    const ciphertext = CryptoJS.lib.WordArray.create(
      encryptedBytes.words.slice(4),
      encryptedBytes.sigBytes - 16
    );
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext }),
      CryptoJS.enc.Utf8.parse(key.padEnd(32, '0').slice(0, 32)), // Ensure 32 bytes
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  getDashboard(id: string): Observable<any> {
  const key = this.aesKey;
  const decode = (encrypted: string) => {
    const result = this.decryptResponseWithDynamicIv(encrypted, key);
    return result;
  };

  const url = `${environment.url1}${Config.GET_DASHBOARD_DATA}`;
 const payload = { id };
  return this.http.post<any>(url, payload).pipe(
    map((response: { data: any[]; }) => {
      if (Array.isArray(response.data)) {
        response.data = response.data.map((item: any) => {
          const decryptedItem: any = {};
          for (const key in item) {
            if (['NoOfResume', 'closed_at', 'timestamp'].includes(key)) {
              decryptedItem[key] = item[key];
            } else {
              decryptedItem[key] = decode(item[key]);
            }
          }
          return decryptedItem;
        });
      }
      return response;
    })
  );
}

  setDisplayName(name: string) {
    this._userDisplayName.next(name);
  }
  private _userDisplayName = new BehaviorSubject<string>('');
  private _emplId = new BehaviorSubject<string>('');
  public empId$ = this._emplId.asObservable();

  getEmplId(): string {
    return this._emplId.value;
  }
  // setEmpId(id: string) {
  //   this._emplId.next(id);
  //   if (id) {
  //     this.getEmpBaseDataById(id).subscribe({
  //       next: (empDetails) => {
  //         const base = empDetails?.data?.employeeBase;
  //         if (base && base.displayName) {
  //           this._userDisplayName.next(base.displayName);
  //         } else {
  //           this._userDisplayName.next('');
  //         }
  //       },
  //       error: () => {
  //         this._userDisplayName.next('');
  //       }
  //     });
  //   } else {
  //     this._userDisplayName.next('');
  //   }
  // }

//   setEmpId(id: string) {
//   this._emplId.next(id);
 
//   if (id) {
//     // Call isLoggedIn instead of GetEmployeeDetails
//     this.isloginCheck().subscribe({
//       next: (res: any) => {
//         // keep existing logic intact
//         const displayName =
//           res?.data?.displayName ||
//           res?.displayName ||
//           '';
 
//         this._userDisplayName.next(displayName);
//       },
//       error: () => {
//         this._userDisplayName.next('');
//       }
//     });
//   } else {
//     this._userDisplayName.next('');
//   }
// }


setEmpId(id: string) {
  this._emplId.next(id);
 
  if (!id) {
    this._userDisplayName.next('');
    return;
  }
 
  this.isloginCheck().subscribe({
    next: (res: any) => {
 
      if (res?.logged_in && res?.employee_details?.length > 0) {
 
        const empDetails = res.employee_details[0];
 
        // 🔐 ENCRYPTED values from backend
        const encryptedEmpId = empDetails.emp_id || '';
        const encryptedName = empDetails.name || '';
 
        // 🔓 DECRYPT using existing function
        const decryptedEmpId = this.decryptResponseWithDynamicIv(
          encryptedEmpId,
          this.aesKey
        );
 
        const decryptedName = this.decryptResponseWithDynamicIv(
          encryptedName,
          this.aesKey
        );
 
        // ✅ UPDATE observables with DECRYPTED values
        this._emplId.next(decryptedEmpId);
        this._userDisplayName.next(decryptedName);
 
      } else {
        this._emplId.next('');
        this._userDisplayName.next('');
      }
    },
    error: () => {
      this._emplId.next('');
      this._userDisplayName.next('');
    }
  });
}



  getHeaders() {
    let AuthToken = sessionStorage.getItem("accessToken");

    return {
      'Authorization': `Bearer ${AuthToken}`,
      'Content-Type': 'application/json',
    };
  }
  getHeaderforMultipart() {
    let AuthToken = sessionStorage.getItem("accessToken");

    return {
      'Authorization': `Bearer ${AuthToken}`,
    };
  }

  /**
   * Fetches candidates for a given requirement ID
   * @param requirementId - The requirement ID
   * @returns Observable with the candidates array
   */
  getCandidatesForRequirement(requirementId: string): Observable<any[]> {
    // Adjust the endpoint as per your backend API
    const url = `${environment.url1}/requirements/${requirementId}/candidates`;
    return this.http.get<any[]>(url);
    //  const customeHeader = this.getHeaders();
    // return this.http.get<any[]>(url, { headers: customeHeader });
  }
  /**
   * Calls the getdashboard API endpoint
   * @returns Observable with the dashboard data
   */
  // getDashboard(employeeId: string): Observable<any> {
  //   const url = `${environment.url1}${Config.GET_DASHBOARD_DATA}`;
  //   return this.http.post<any>(url, { id: employeeId });
  //   // const customeHeader = this.getHeaders();
  //   // return this.http.get<any[]>(url, { headers: customeHeader });
  // }
  public isLoggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem('isLoggedIn'));

  setLoggedIn(value: boolean) {
    this.isLoggedIn$.next(value);
    if (value) {
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      localStorage.removeItem('isLoggedIn');
    }
  }
  // Add this getter method to AiService class
  get isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  // Method to check login status on app initialization - optimized for both UX and security
  checkInitialLoginState(): void {
    // Check localStorage first (fast UI response)
    const storedLoginState = localStorage.getItem('isLoggedIn') === 'true';

    if (storedLoginState) {
      // Update UI immediately based on localStorage for better UX
      this.isLoggedIn$.next(true);


      // THEN verify with server in background for security
      this.isloginCheck().subscribe({
        next: (response) => {
          // If server says not logged in despite localStorage, update state
          if (!response || !response.logged_in) {
            this.setLoggedIn(false);

          }
        },
        error: () => {
          // On error, maintain the logged in state but log the issue

        }
      });
    } else {
      // No local login state, check with the server
      this.isloginCheck().subscribe({
        next: (response) => {
          if (response && response.logged_in) {
            this.setLoggedIn(true);

          } else {
            this.setLoggedIn(false);

          }
        },
        error: () => {
          this.setLoggedIn(false);

        }
      });
    }
  }

  constructor() { }

  private http = inject(HttpClient);

  getEmpBaseDataById(userId: string): Observable<any> {
    let url = `${environment.url2}${Config.GET_EMPLOYEE_BASE_DATA_BY_ID}/${userId}`;
    return this.http.get(url);
  }
  ssoLogin(): Observable<any> {
    let url = `${environment.url1}${Config.SSO_LOGIN}`;
    return this.http.get(url);
  }

  /**
   * Check if a file object represents a folder
   * @param file The file object to check
   * @returns True if the file appears to be a folder representation
   */
  private isFolder(file: File): boolean {
    return file.type === 'application/folder';
  }

  /**
   * Sends requirement details to the backend API
   * @param requirementData - Object containing all form data for the requirement
   * @returns Observable with the API response
   */
  addRequirementDetails(requirementData: any): Observable<any> {
    const url = `${environment.url1}${Config.SAVE_REQUIREMENT_DETAILS}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(url, requirementData, { headers });
  }

  /**
   * Uploads a template file (Excel, CSV) for processing
   * @param file - The file to upload
   * @param reportProgress - Whether to report upload progress events
   * @returns Observable with the API response
   */
  uploadRequirementTemplate(file: File, reportProgress: boolean = true): Observable<HttpEvent<any>> {
    const url = `${environment.url1}${Config.READ_REQUIREMENT_TEMPLATE}`;
    const formData = new FormData();
    formData.append('template', file);

    return this.http.post<any>(url, formData, {
      reportProgress,
      observe: 'events',
      responseType: 'text' as 'json' // Cast needed because we want to handle text response manually
    });
  }

  /**
   * Downloads a requirement template file from the backend
   * @returns Observable with the file blob
   */
  downloadRequirementTemplate(): Observable<Blob> {
    const url = `${environment.url1}${Config.DOWNLOAD_REQUIREMENT_TEMPLATE}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Helper method to process JSON response that might contain invalid JSON values like NaN, Infinity
   * @param jsonString - The raw JSON string from the server
   * @returns Processed and parsed JSON object
   */
  processJsonResponse(jsonString: string): any {
    try {
      // Replace invalid JSON values (NaN, Infinity, -Infinity) with null
      const processedJson = jsonString
        .replace(/:\s*NaN\s*([,}])/g, ': null$1')
        .replace(/:\s*Infinity\s*([,}])/g, ': null$1')
        .replace(/:\s*-Infinity\s*([,}])/g, ': null$1');

      return JSON.parse(processedJson);
    } catch (error) {

      throw error;
    }
  }

  /**
   * Uploads resumes to the server
   * @param formData - FormData containing files, metadata and requirementId
   * @param reportProgress - Whether to report upload progress events
   * @returns Observable with upload events
   */
  uploadResumes(
    formData: FormData,
    reportProgress: boolean = true
  ): Observable<HttpEvent<any>> {
    const url = `${environment.url1}${Config.UPLOAD_RESUMES}`;

    const headers = new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest'
    });

    return this.http.post<any>(url, formData, {
      headers,
      reportProgress,
      observe: 'events'
    });
  }

  /**
   * Sends an email to selected candidates
   * @param candidateIds - Array of candidate IDs or emails
   * @param emailData - Object containing email subject, body, etc.
   * @returns Observable with the API response
   */
  sendEmailToCandidates(payload: any): Observable<any> {
    const url = `${environment.url1}${Config.SEND_EMAIL}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(url, payload, { headers });
  }

  getProfileData(userId: string): Observable<any> {
    const url = `${environment.url1}${Config.GET_PROFILE_DATA_BY_ID}`;
    return this.http.post<any>(url, { id: userId });
  }

  closeRequirement(payload: { req_id: string }): Observable<any> {
    const url = `${environment.url1}${Config.CLOSE_REQUIREMENT}`;
    return this.http.post<any>(url, payload);
  }
  getRequirementDetails(payload: any): Observable<any> {
    const url = `${environment.url1}${Config.GET_REQUIREMENT_DETAILS}`;
    return this.http.post<any>(url, payload);
  }
  analyzeProfile(payload: any): Observable<any> {
    const url = `${environment.url1}${Config.ANALYZE_PROFILE}`;
    return this.http.post<any>(url, payload);
  }




  get userDisplayName$() {
    return this._userDisplayName.asObservable();
  }
  // get emplId$() {
  //   return this._emplId.asObservable();
  // }
  getUserDisplayName(): string {
    return this._userDisplayName.getValue();
  }

  sendInterviewDetails(payload: any): Observable<any> {
    const url = `${environment.url1}${Config.SEND_INTERVIEW_DETAILS}`;
    // Accept FormData for file upload
    return this.http.post<any>(url, payload);
  }
  getAnalysisDetails(payload: any): Observable<any> {
    const url = `${environment.url1}${Config.GET_ANALYSIS_DETAILS}`;
    return this.http.post<any>(url, payload);
  }
  getCandidateDetails(payload: any): Observable<any> {
    // Assuming there's an endpoint to get candidate details
    const url = `${environment.url1}${Config.GET_INTERVIEW_DETAILS}`;
    return this.http.post<any>(url, payload);
  }
  reuploadResume(formData: FormData, reportProgress: boolean = true): Observable<HttpEvent<any>> {
    const url = `${environment.url1}${Config.REUPLOAD_RESUME}`;
    const headers = new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest'
    });
    return this.http.post<any>(url, formData, {
      headers,
      reportProgress,
      observe: 'events'
    });
  }
  isloginCheck(): Observable<any> {
    const url = `${environment.url1}${Config.IS_LOGGED_IN}`;
    return this.http.get<any>(url);
  }
  islogout(): Observable<any> {
    const url = `${environment.url1}${Config.LOGOUT}`;
    return this.http.post<any>(url, {});
  }
}
