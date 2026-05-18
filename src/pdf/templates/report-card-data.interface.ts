export interface SubjectScoreData {
  name: string;
  componentScores: {
    component: string;
    score: number | null;
  }[];
  totalScore: number | null;
  grade: string | null;
}

export interface ScoreComponentData {
  component: string;
  maxScore: number;
}

export interface ReportCardData {
  school: {
    name: string;
    logoUrl: string | null;
    stampUrl: string | null;
    address: string | null;
    defaultReportTemplate: string | null;
  };
  student: {
    fullName: string;
    admissionNumber: string;
    passportPhotoUrl: string | null;
    currentClass: string;
  };
  term: {
    name: string;
    sessionName: string;
    totalSchoolDays: number;
  };
  result: {
    totalScore: number | null;
    percentage: number | null;
    position: number | null;
    classTeacherRemark: string | null;
    principalRemark: string | null;
  };
  scoreComponents: ScoreComponentData[];
  subjectScores: SubjectScoreData[];
  attendance: {
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
  };
  staff: {
    classTeacherName: string | null;
    principalName: string | null;
  };
}
