"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGrade = void 0;
const enums_1 = require("../../common/enums");
const calculateGrade = (score, maxScore, system) => {
    const percentage = (score / maxScore) * 100;
    switch (system) {
        case enums_1.GradingSystem.WAEC:
            return calculateWAEC(percentage);
        case enums_1.GradingSystem.PERCENTAGE:
            return `${Math.round(percentage)}%`;
        case enums_1.GradingSystem.LETTER:
            return calculateLetter(percentage);
        case enums_1.GradingSystem.GPA:
            return calculateGPA(percentage);
        default:
            return 'N/A';
    }
};
exports.calculateGrade = calculateGrade;
const calculateWAEC = (percentage) => {
    if (percentage >= 75)
        return 'A1';
    if (percentage >= 70)
        return 'B2';
    if (percentage >= 65)
        return 'B3';
    if (percentage >= 60)
        return 'C4';
    if (percentage >= 55)
        return 'C5';
    if (percentage >= 50)
        return 'C6';
    if (percentage >= 45)
        return 'D7';
    if (percentage >= 40)
        return 'E8';
    return 'F9';
};
const calculateLetter = (percentage) => {
    if (percentage >= 70)
        return 'A';
    if (percentage >= 60)
        return 'B';
    if (percentage >= 50)
        return 'C';
    if (percentage >= 40)
        return 'D';
    return 'F';
};
const calculateGPA = (percentage) => {
    if (percentage >= 70)
        return '5.0';
    if (percentage >= 60)
        return '4.0';
    if (percentage >= 50)
        return '3.0';
    if (percentage >= 40)
        return '2.0';
    return '1.0';
};
//# sourceMappingURL=grading.util.js.map