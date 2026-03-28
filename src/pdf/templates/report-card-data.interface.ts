export interface SubjectScoreData {
  name: string;
  assignments: number | null;
  tests: number | null;
  exam: number | null;
  totalScore: number | null;
  grade: string | null;
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
    grade: string | null;
    position: number | null;
    classTeacherRemark: string | null;
    principalRemark: string | null;
  };
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
