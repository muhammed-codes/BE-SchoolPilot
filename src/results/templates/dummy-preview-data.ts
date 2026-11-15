import { ReportCardData } from '../../pdf/templates/report-card-data.interface';

export const getRealisticDummyReportCardData = (
  customSchoolName?: string,
  logoUrl?: string,
): ReportCardData => ({
  school: {
    name: customSchoolName || 'Ath-Thabat College International',
    logoUrl: logoUrl || 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=128&auto=format&fit=crop&q=80',
    stampUrl: null,
    address: '14 Unity Crescent, Victoria Island, Lagos State, Nigeria',
    defaultReportTemplate: 'standard',
  },
  student: {
    fullName: 'Zainab Fatima Musa',
    admissionNumber: 'STD-26-ATH-004',
    passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    currentClass: 'JSS 2A',
    totalStudentsInClass: 34,
  },
  term: {
    name: 'First Term',
    sessionName: '2026/2027 Academic Session',
    totalSchoolDays: 65,
  },
  result: {
    totalScore: 1148,
    percentage: 76.53,
    position: 3,
    classTeacherRemark:
      'Zainab is a remarkably diligent and attentive student who shows keen analytical capability across core sciences and humanities.',
    principalRemark:
      'An outstanding academic output. Commended for consistency and exemplary classroom conduct.',
  },
  scoreComponents: [
    { component: 'CA 1', maxScore: 20 },
    { component: 'CA 2', maxScore: 20 },
    { component: 'Exam', maxScore: 60 },
  ],
  subjectScores: [
    {
      name: 'English Language',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 18 },
        { component: 'CA 2', maxScore: 20, score: 17 },
        { component: 'Exam', maxScore: 60, score: 48 },
      ],
      totalScore: 83,
      grade: 'A1',
    },
    {
      name: 'Mathematics',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 19 },
        { component: 'CA 2', maxScore: 20, score: 18 },
        { component: 'Exam', maxScore: 60, score: 52 },
      ],
      totalScore: 89,
      grade: 'A1',
    },
    {
      name: 'Basic Science & Technology',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 16 },
        { component: 'CA 2', maxScore: 20, score: 17 },
        { component: 'Exam', maxScore: 60, score: 44 },
      ],
      totalScore: 77,
      grade: 'B2',
    },
    {
      name: 'Social Studies & Civic Education',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 17 },
        { component: 'CA 2', maxScore: 20, score: 16 },
        { component: 'Exam', maxScore: 60, score: 42 },
      ],
      totalScore: 75,
      grade: 'B2',
    },
    {
      name: 'Agricultural Science',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 15 },
        { component: 'CA 2', maxScore: 20, score: 16 },
        { component: 'Exam', maxScore: 60, score: 45 },
      ],
      totalScore: 76,
      grade: 'B2',
    },
    {
      name: 'Business Studies',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 18 },
        { component: 'CA 2', maxScore: 20, score: 18 },
        { component: 'Exam', maxScore: 60, score: 49 },
      ],
      totalScore: 85,
      grade: 'A1',
    },
    {
      name: 'Information & Communication Technology',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 20 },
        { component: 'CA 2', maxScore: 20, score: 19 },
        { component: 'Exam', maxScore: 60, score: 55 },
      ],
      totalScore: 94,
      grade: 'A1',
    },
    {
      name: 'French Language',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 14 },
        { component: 'CA 2', maxScore: 20, score: 15 },
        { component: 'Exam', maxScore: 60, score: 39 },
      ],
      totalScore: 68,
      grade: 'B3',
    },
    {
      name: 'Arabic & Islamic Studies',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 19 },
        { component: 'CA 2', maxScore: 20, score: 18 },
        { component: 'Exam', maxScore: 60, score: 51 },
      ],
      totalScore: 88,
      grade: 'A1',
    },
    {
      name: 'Home Economics',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 15 },
        { component: 'CA 2', maxScore: 20, score: 14 },
        { component: 'Exam', maxScore: 60, score: 41 },
      ],
      totalScore: 70,
      grade: 'B3',
    },
    {
      name: 'Physical & Health Education',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 17 },
        { component: 'CA 2', maxScore: 20, score: 16 },
        { component: 'Exam', maxScore: 60, score: 43 },
      ],
      totalScore: 76,
      grade: 'B2',
    },
    {
      name: 'Visual & Creative Arts',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 16 },
        { component: 'CA 2', maxScore: 20, score: 15 },
        { component: 'Exam', maxScore: 60, score: 40 },
      ],
      totalScore: 71,
      grade: 'B3',
    },
    {
      name: 'Music & Performing Arts',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 14 },
        { component: 'CA 2', maxScore: 20, score: 15 },
        { component: 'Exam', maxScore: 60, score: 38 },
      ],
      totalScore: 67,
      grade: 'B3',
    },
    {
      name: 'History',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 16 },
        { component: 'CA 2', maxScore: 20, score: 16 },
        { component: 'Exam', maxScore: 60, score: 44 },
      ],
      totalScore: 76,
      grade: 'B2',
    },
    {
      name: 'Hausa Language',
      scoreComponents: [
        { component: 'CA 1', maxScore: 20 },
        { component: 'CA 2', maxScore: 20 },
        { component: 'Exam', maxScore: 60 },
      ],
      componentScores: [
        { component: 'CA 1', maxScore: 20, score: 14 },
        { component: 'CA 2', maxScore: 20, score: 13 },
        { component: 'Exam', maxScore: 60, score: 36 },
      ],
      totalScore: 63,
      grade: 'C4',
    },
  ],
  attendance: {
    daysPresent: 63,
    daysAbsent: 2,
    daysLate: 1,
  },
  staff: {
    classTeacherName: 'Mr. Babatunde Alabi',
    principalName: 'Dr. (Mrs.) Amina Bello',
  },
});
