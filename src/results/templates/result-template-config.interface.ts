export interface ResultTableColumnConfig {
  id: string;
  type:
    | 'subject'
    | 'component'
    | 'total'
    | 'grade'
    | 'remark'
    | 'classAverage'
    | 'position'
    | 'highestScore'
    | 'lowestScore';
  componentKey?: string;
  label: string;
  visible: boolean;
  order: number;
  widthPercent?: number;
  align: 'left' | 'center' | 'right';
  bold?: boolean;
}

export interface ResultTemplateConfig {
  // A. School Branding and Header
  branding: {
    showSchoolName: boolean;
    customSchoolName?: string;
    showLogo: boolean;
    logoWidth?: number; // px
    logoPosition?: 'left' | 'center' | 'right';
    showAddress: boolean;
    customAddress?: string;
    showContactInfo: boolean;
    contactInfoText?: string;
    reportTitle: string;
    showSessionAndTerm: boolean;
    headerText?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headerBackgroundColor: string;
    headerTextColor: string;
    fontFamily: string;
    headerAlignment: 'left' | 'center' | 'right';
  };

  // B. Student Information
  studentInfo: {
    showPassportPhoto: boolean;
    photoPosition: 'left' | 'right';
    showStudentName: boolean;
    nameLabel: string;
    showAdmissionNumber: boolean;
    admissionNumberLabel: string;
    showClass: boolean;
    classLabel: string;
    showGender: boolean;
    genderLabel: string;
    showDateOfBirth: boolean;
    dateOfBirthLabel: string;
    showClassTeacher: boolean;
    classTeacherLabel: string;
    showTotalStudentsInClass: boolean;
    totalStudentsInClassLabel: string;
    showClassPosition: boolean;
    classPositionLabel: string;
    showSessionAndTerm: boolean;
    sessionAndTermLabel: string;
    layoutStyle: 'grid' | 'cards' | 'inline';
    fieldsOrder: string[];
  };

  // C. Results Table
  resultsTable: {
    columns: ResultTableColumnConfig[];
    headerBackgroundColor: string;
    headerTextColor: string;
    alternateRowColor: string;
    rowBackgroundColor: string;
    textColor: string;
    borderColor: string;
    showBorders: boolean;
    borderStyle: 'solid' | 'dashed' | 'none';
    fontSize: 'xs' | 'sm' | 'md';
    cellPadding: 'compact' | 'normal' | 'relaxed';
  };

  // D. Performance Summary
  performanceSummary: {
    showTotalScore: boolean;
    totalScoreLabel: string;
    showAverageScore: boolean;
    averageScoreLabel: string;
    showOverallGrade: boolean;
    overallGradeLabel: string;
    showOverallPosition: boolean;
    overallPositionLabel: string;
    showSubjectsOffered: boolean;
    subjectsOfferedLabel: string;
    showSubjectsPassed: boolean;
    subjectsPassedLabel: string;
    showSubjectsFailed: boolean;
    subjectsFailedLabel: string;
    passBenchmark: number;
    showClassAverage: boolean;
    classAverageLabel: string;
    showAttendanceSummary: boolean;
    attendanceLabel: string;
    showBehavioralAssessment: boolean;
    behavioralCategories?: { name: string; scoreLabel: string }[];
    showNextTermResumption: boolean;
    nextTermResumptionLabel: string;
    resumptionDateText?: string;
    layout: 'stat-strip' | 'grid' | 'cards';
  };

  // E. Comments and Signatures
  commentsAndSignatures: {
    showClassTeacherRemark: boolean;
    classTeacherRemarkTitle: string;
    showPrincipalRemark: boolean;
    principalRemarkTitle: string;
    showCustomComment: boolean;
    customCommentTitle?: string;
    customCommentText?: string;
    showSignatures: boolean;
    showClassTeacherSignature: boolean;
    classTeacherRoleLabel: string;
    showPrincipalSignature: boolean;
    principalRoleLabel: string;
    showStamp: boolean;
    stampPosition: 'center' | 'left' | 'right';
    showDate: boolean;
    dateLabel: string;
  };

  // F. Footer
  footer: {
    showFooter: boolean;
    footerText: string;
    showSchoolMotto: boolean;
    schoolMottoText?: string;
    showDisclaimer: boolean;
    disclaimerText?: string;
    showPageNumbering: boolean;
    pageNumberFormat: 'X of Y' | 'Page X';
    footerAlignment: 'left' | 'center' | 'right';
  };

  // G. Advanced Page Layout and Pagination
  pageLayout: {
    paperSize: 'A4' | 'LETTER';
    orientation: 'portrait' | 'landscape';
    marginTopMm: number;
    marginBottomMm: number;
    marginLeftMm: number;
    marginRightMm: number;
    fontScale: 'sm' | 'base' | 'lg';
    maxSubjectsPerPage: number; // 0 = automatic
    tablePaginationMode: 'auto' | 'split-by-max-rows' | 'compact-two-column';
    repeatTableHeadersOnSubsequentPages: boolean;
    repeatStudentInfoOnSubsequentPages: boolean;
    keepSummaryWithSignatures: boolean;
  };
}

export const DEFAULT_COLUMNS: ResultTableColumnConfig[] = [
  {
    id: 'subject',
    type: 'subject',
    label: 'Subject',
    visible: true,
    order: 0,
    widthPercent: 28,
    align: 'left',
    bold: true,
  },
  {
    id: 'ca1',
    type: 'component',
    componentKey: 'CA 1',
    label: 'CA 1',
    visible: true,
    order: 1,
    widthPercent: 12,
    align: 'center',
  },
  {
    id: 'ca2',
    type: 'component',
    componentKey: 'CA 2',
    label: 'CA 2',
    visible: true,
    order: 2,
    widthPercent: 12,
    align: 'center',
  },
  {
    id: 'exam',
    type: 'component',
    componentKey: 'Exam',
    label: 'Exam',
    visible: true,
    order: 3,
    widthPercent: 14,
    align: 'center',
  },
  {
    id: 'total',
    type: 'total',
    label: 'Total',
    visible: true,
    order: 4,
    widthPercent: 14,
    align: 'center',
    bold: true,
  },
  {
    id: 'grade',
    type: 'grade',
    label: 'Grade',
    visible: true,
    order: 5,
    widthPercent: 10,
    align: 'center',
    bold: true,
  },
  {
    id: 'remark',
    type: 'remark',
    label: 'Remark',
    visible: true,
    order: 6,
    widthPercent: 10,
    align: 'center',
  },
];

export const getDefaultResultTemplateConfig = (
  schoolName = 'SchoolRight Academy',
  primaryColor = '#146356',
): ResultTemplateConfig => ({
  branding: {
    showSchoolName: true,
    customSchoolName: schoolName,
    showLogo: true,
    logoWidth: 64,
    logoPosition: 'left',
    showAddress: true,
    showContactInfo: true,
    reportTitle: 'STUDENT ACADEMIC PERFORMANCE REPORT',
    showSessionAndTerm: true,
    headerText: 'Excellence in Character and Learning',
    primaryColor: primaryColor || '#146356',
    secondaryColor: '#E4EEEA',
    accentColor: '#146356',
    headerBackgroundColor: '#E4EEEA',
    headerTextColor: '#14201C',
    fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    headerAlignment: 'left',
  },
  studentInfo: {
    showPassportPhoto: true,
    photoPosition: 'left',
    showStudentName: true,
    nameLabel: 'Student Name',
    showAdmissionNumber: true,
    admissionNumberLabel: 'Admission No',
    showClass: true,
    classLabel: 'Class',
    showGender: true,
    genderLabel: 'Gender',
    showDateOfBirth: false,
    dateOfBirthLabel: 'Date of Birth',
    showClassTeacher: true,
    classTeacherLabel: 'Form Teacher',
    showTotalStudentsInClass: true,
    totalStudentsInClassLabel: 'Class Population',
    showClassPosition: true,
    classPositionLabel: 'Class Position',
    showSessionAndTerm: true,
    sessionAndTermLabel: 'Session / Term',
    layoutStyle: 'grid',
    fieldsOrder: [
      'name',
      'admissionNumber',
      'class',
      'gender',
      'classTeacher',
      'position',
    ],
  },
  resultsTable: {
    columns: DEFAULT_COLUMNS,
    headerBackgroundColor: '#E4EEEA',
    headerTextColor: '#14201C',
    alternateRowColor: '#F9F8F5',
    rowBackgroundColor: '#FFFFFF',
    textColor: '#14201C',
    borderColor: '#D8D5CB',
    showBorders: true,
    borderStyle: 'solid',
    fontSize: 'sm',
    cellPadding: 'normal',
  },
  performanceSummary: {
    showTotalScore: true,
    totalScoreLabel: 'Total Marks',
    showAverageScore: true,
    averageScoreLabel: 'Average (%)',
    showOverallGrade: true,
    overallGradeLabel: 'Overall Grade',
    showOverallPosition: true,
    overallPositionLabel: 'Class Position',
    showSubjectsOffered: true,
    subjectsOfferedLabel: 'Subjects Offered',
    showSubjectsPassed: true,
    subjectsPassedLabel: 'Subjects Passed',
    showSubjectsFailed: false,
    subjectsFailedLabel: 'Subjects Failed',
    passBenchmark: 50,
    showClassAverage: true,
    classAverageLabel: 'Class Average',
    showAttendanceSummary: true,
    attendanceLabel: 'Attendance (Days Present / Total)',
    showBehavioralAssessment: false,
    showNextTermResumption: true,
    nextTermResumptionLabel: 'Next Term Resumption',
    resumptionDateText: 'To be announced',
    layout: 'stat-strip',
  },
  commentsAndSignatures: {
    showClassTeacherRemark: true,
    classTeacherRemarkTitle: "Class Teacher's Remark",
    showPrincipalRemark: true,
    principalRemarkTitle: "Principal's Remark",
    showCustomComment: false,
    showSignatures: true,
    showClassTeacherSignature: true,
    classTeacherRoleLabel: 'Class Teacher',
    showPrincipalSignature: true,
    principalRoleLabel: 'Principal',
    showStamp: true,
    stampPosition: 'center',
    showDate: true,
    dateLabel: 'Date Issued',
  },
  footer: {
    showFooter: true,
    footerText:
      'This report card is an official academic transcript produced by SchoolRight.',
    showSchoolMotto: true,
    schoolMottoText: 'Knowledge is Light',
    showDisclaimer: false,
    showPageNumbering: true,
    pageNumberFormat: 'X of Y',
    footerAlignment: 'center',
  },
  pageLayout: {
    paperSize: 'A4',
    orientation: 'portrait',
    marginTopMm: 12,
    marginBottomMm: 12,
    marginLeftMm: 12,
    marginRightMm: 12,
    fontScale: 'base',
    maxSubjectsPerPage: 14,
    tablePaginationMode: 'auto',
    repeatTableHeadersOnSubsequentPages: true,
    repeatStudentInfoOnSubsequentPages: true,
    keepSummaryWithSignatures: true,
  },
});
