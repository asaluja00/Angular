export interface Candidate {
  // Original fields
  final_score_value?: number;
  passing_score?: number;
  resume_shortlist_score?: number;
  id?: number | string;
  name: string;
  position: string;
  initials: string;
  emailSent?: boolean;
  selected?: boolean;
  matchScore?: number;
  analyzing?: boolean;
  profileAnalyzed?: boolean;
  qualification_score?: number;
  work_exp_score?: number;
  skills_score?: number;
  profileScore?: number;
  interviewScore?: number | string;
  
  // New fields from API response
  overall_score?: number;
  experience_score?: number;
  req_id?: string | undefined;
}