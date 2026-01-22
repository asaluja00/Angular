export interface ResumeRelInfo {
  education_qualification?: {
    cgpa?: string;
    degree?: string;
    grade_10?: {
      board?: string;
      cgpa?: string;
      institution?: string;
    };
    grade_12?: {
      board?: string;
      institution?: string;
      percentage?: string;
    };
    institution?: string;
    percentage?: string;
  };
  email?: string;
  name?: string;
  project_names?: string[];
  project_tools?: string[];
  skills?: string[];
  work_experience?: Array<{
    company?: string;
    duration?: string;
    position?: string;
    responsibilities?: string;
  }>;
}