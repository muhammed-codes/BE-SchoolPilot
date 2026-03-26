import { GradingSystem } from '../../common/enums';

export const calculateGrade = (
  score: number,
  maxScore: number,
  system: GradingSystem,
): string => {
  const percentage = (score / maxScore) * 100;

  switch (system) {
    case GradingSystem.WAEC:
      return calculateWAEC(percentage);
    case GradingSystem.PERCENTAGE:
      return `${Math.round(percentage)}%`;
    case GradingSystem.LETTER:
      return calculateLetter(percentage);
    case GradingSystem.GPA:
      return calculateGPA(percentage);
    default:
      return 'N/A';
  }
};

const calculateWAEC = (percentage: number): string => {
  if (percentage >= 75) return 'A1';
  if (percentage >= 70) return 'B2';
  if (percentage >= 65) return 'B3';
  if (percentage >= 60) return 'C4';
  if (percentage >= 55) return 'C5';
  if (percentage >= 50) return 'C6';
  if (percentage >= 45) return 'D7';
  if (percentage >= 40) return 'E8';
  return 'F9';
};

const calculateLetter = (percentage: number): string => {
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const calculateGPA = (percentage: number): string => {
  if (percentage >= 70) return '5.0';
  if (percentage >= 60) return '4.0';
  if (percentage >= 50) return '3.0';
  if (percentage >= 40) return '2.0';
  return '1.0';
};
