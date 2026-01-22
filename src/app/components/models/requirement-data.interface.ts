export interface RequirementData {
  title: string;
  description: string;
  jobRole: string;
  resumeShortlistPercentage: number | null;
  interviewPassPercentage: number | null;
  jobDescription: string;
  rolesAndResponsibilities: string;
  experience: string;
  experienceWeightage: number | null;
  mandatorySkills: string;
  mandatorySkillsWeightage: number | null;
  optionalSkills: string;
  optionalSkillsWeightage: number | null;
  education: string;
  educationWeightage: number | null;
  certifications: string;
  certificationsWeightage: number | null;
  [key: string]: any; // Index signature for any additional properties
}
