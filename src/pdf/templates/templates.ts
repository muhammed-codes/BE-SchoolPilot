import { ReportCardData } from './report-card-data.interface';

const classicTemplate = (data: ReportCardData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Report Card</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            background-color: #fff;
            font-size: 14px;
        }
        .header {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #1A56A8;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .logo {
            width: 100px;
            height: 100px;
            object-fit: contain;
            margin-right: 20px;
        }
        .school-info {
            flex-grow: 1;
            text-align: center;
        }
        .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #1A56A8;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .school-address {
            font-size: 14px;
            color: #555;
            margin: 0;
        }
        .report-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .student-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-group {
            border: 1px solid #e0e0e0;
            padding: 15px;
            border-radius: 4px;
        }
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: bold;
            width: 130px;
            color: #555;
        }
        .student-photo {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px 12px;
            text-align: center;
        }
        th {
            background-color: #1A56A8;
            color: #fff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
        }
        td.subject-name {
            text-align: left;
            font-weight: bold;
        }
        .remarks-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .remark-box {
            border: 1px solid #e0e0e0;
            padding: 15px;
            border-radius: 4px;
        }
        .remark-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #1A56A8;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 50px;
            align-items: flex-end;
        }
        .signature-block {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 10px;
            padding-top: 5px;
            font-weight: bold;
        }
        .stamp-container {
            text-align: center;
        }
        .stamp-img {
            max-width: 120px;
            max-height: 120px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="header">
        ${data.school.logoUrl ? `<img src="${data.school.logoUrl}" class="logo" alt="School Logo" />` : '<div class="logo"></div>'}
        <div class="school-info">
            <h1 class="school-name">${data.school.name}</h1>
            <p class="school-address">${data.school.address || ''}</p>
        </div>
        <div style="width: 100px;"></div> <!-- balance flex -->
    </div>

    <div class="report-title">
        STUDENT TERMINAL REPORT CARD
    </div>

    <div class="student-info-grid">
        <div class="info-group">
            <div class="info-row"><span class="info-label">Name:</span> <span>${data.student.fullName}</span></div>
            <div class="info-row"><span class="info-label">Admission No:</span> <span>${data.student.admissionNumber}</span></div>
            <div class="info-row"><span class="info-label">Class:</span> <span>${data.student.currentClass}</span></div>
            <div class="info-row"><span class="info-label">Position:</span> <span>${data.result.position || 'N/A'}</span></div>
        </div>
        <div class="info-group">
            <div class="info-row"><span class="info-label">Session:</span> <span>${data.term.sessionName}</span></div>
            <div class="info-row"><span class="info-label">Term:</span> <span>${data.term.name}</span></div>
            <div class="info-row"><span class="info-label">Total Score:</span> <span>${data.result.totalScore !== null ? data.result.totalScore.toFixed(2) : 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Final Grade:</span> <span>${data.result.grade || 'N/A'}</span></div>
        </div>
        <div>
            ${data.student.passportPhotoUrl ? `<img src="${data.student.passportPhotoUrl}" class="student-photo" alt="Student Photo" />` : '<div class="student-photo" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No Photo</div>'}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="text-align: left;">Subject</th>
                <th>Assignments</th>
                <th>Tests</th>
                <th>Exam</th>
                <th>Total Score</th>
                <th>Grade</th>
            </tr>
        </thead>
        <tbody>
            ${data.subjectScores
              .map(
                (score) => `
                <tr>
                    <td class="subject-name">${score.name}</td>
                    <td>${score.assignments !== null ? score.assignments : '-'}</td>
                    <td>${score.tests !== null ? score.tests : '-'}</td>
                    <td>${score.exam !== null ? score.exam : '-'}</td>
                    <td style="font-weight: bold;">${score.totalScore !== null ? score.totalScore : '-'}</td>
                    <td style="font-weight: bold; color: #1A56A8;">${score.grade || '-'}</td>
                </tr>
            `,
              )
              .join('')}
        </tbody>
    </table>

    <div class="remarks-section">
        <div class="remark-box">
            <div class="remark-title">Class Teacher's Remark</div>
            <p>${data.result.classTeacherRemark || 'No remark provided.'}</p>
        </div>
        <div class="remark-box">
            <div class="remark-title">Principal's Remark</div>
            <p>${data.result.principalRemark || 'No remark provided.'}</p>
        </div>
    </div>

    <div class="student-info-grid" style="grid-template-columns: 1fr; margin-bottom: 20px;">
        <div class="info-group" style="display: flex; justify-content: space-around;">
            <div><strong>Attendance Summary:</strong></div>
            <div>Days Present: ${data.attendance.daysPresent}</div>
            <div>Days Absent: ${data.attendance.daysAbsent}</div>
            <div>Days Late: ${data.attendance.daysLate}</div>
            <div>Total School Days: ${data.term.totalSchoolDays}</div>
        </div>
    </div>

    <div class="signatures">
        <div class="signature-block">
            <div style="height: 50px;"></div>
            <div class="signature-line">${data.staff.classTeacherName || 'Class Teacher'}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">Class Teacher</div>
        </div>
        
        <div class="stamp-container">
            ${data.school.stampUrl ? `<img src="${data.school.stampUrl}" class="stamp-img" alt="Official Stamp" />` : '<div style="height: 120px; width: 120px; border: 1px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999;">Official Stamp</div>'}
        </div>

        <div class="signature-block">
            <div style="height: 50px;"></div>
            <div class="signature-line">${data.staff.principalName || 'Principal'}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">Principal</div>
        </div>
    </div>
</body>
</html>
`;

const modernTemplate = (data: ReportCardData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Report Card</title>
    <style>
        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #2d3748;
            background-color: #f7fafc;
            font-size: 13px;
        }
        .page-container {
            background-color: #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
            margin: 20px auto;
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #1A56A8;
            color: #fff;
            padding: 30px;
            display: flex;
            align-items: center;
        }
        .logo {
            width: 90px;
            height: 90px;
            object-fit: contain;
            margin-right: 20px;
            background-color: #fff;
            padding: 5px;
            border-radius: 50%;
        }
        .school-info {
            flex-grow: 1;
        }
        .school-name {
            font-size: 26px;
            font-weight: 800;
            margin: 0 0 5px 0;
            letter-spacing: 0.5px;
        }
        .school-address {
            font-size: 14px;
            color: #e2e8f0;
            margin: 0;
        }
        .report-badge {
            background-color: #fff;
            color: #1A56A8;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
        }
        .content {
            padding: 30px;
        }
        .student-profile {
            display: flex;
            background-color: #edf2f7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            align-items: center;
        }
        .student-photo {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-right: 25px;
        }
        .student-details {
            flex-grow: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .detail-item {
            margin: 0;
        }
        .detail-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #718096;
            font-weight: 600;
            display: block;
            margin-bottom: 2px;
        }
        .detail-value {
            font-size: 15px;
            font-weight: bold;
            color: #2d3748;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1A56A8;
            margin-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
        }
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .subject-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            display: flex;
            align-items: center;
        }
        .subject-info {
            flex-grow: 1;
        }
        .subject-name {
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 5px;
            color: #2d3748;
        }
        .subject-breakdown {
            font-size: 11px;
            color: #718096;
        }
        .subject-score-box {
            text-align: center;
            background-color: #ebf4ff;
            padding: 10px 15px;
            border-radius: 6px;
            margin-left: 15px;
        }
        .subject-total {
            font-size: 18px;
            font-weight: 800;
            color: #1A56A8;
            display: block;
        }
        .subject-grade {
            font-size: 13px;
            font-weight: bold;
            color: #4a5568;
        }
        .summary-stats {
            display: flex;
            background-color: #1A56A8;
            color: #fff;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 30px;
        }
        .stat-box {
            flex: 1;
            padding: 20px;
            text-align: center;
            border-right: 1px solid rgba(255,255,255,0.2);
        }
        .stat-box:last-child { border-right: none; }
        .stat-label {
            font-size: 12px;
            text-transform: uppercase;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
        }
        .footer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .remark-card {
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
        }
        .remark-card h4 {
            margin: 0 0 10px 0;
            color: #1A56A8;
            font-size: 14px;
            text-transform: uppercase;
        }
        .remark-text {
            font-style: italic;
            color: #4a5568;
            margin-bottom: 20px;
            min-height: 40px;
        }
        .sign-area {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
        }
        .sign-line {
            border-top: 1px solid #a0aec0;
            padding-top: 5px;
            font-size: 12px;
            font-weight: bold;
            color: #4a5568;
            width: 150px;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="header">
            ${data.school.logoUrl ? `<img src="${data.school.logoUrl}" class="logo" alt="Logo" />` : ''}
            <div class="school-info">
                <h1 class="school-name">${data.school.name}</h1>
                <p class="school-address">${data.school.address || ''}</p>
            </div>
            <div class="report-badge">Term Report</div>
        </div>

        <div class="content">
            <div class="student-profile">
                ${data.student.passportPhotoUrl ? `<img src="${data.student.passportPhotoUrl}" class="student-photo" alt="Photo" />` : '<div class="student-photo" style="background:#cbd5e0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;">No Photo</div>'}
                <div class="student-details">
                    <div class="detail-item">
                        <span class="detail-label">Student Name</span>
                        <span class="detail-value">${data.student.fullName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Admission ID</span>
                        <span class="detail-value">${data.student.admissionNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Class</span>
                        <span class="detail-value">${data.student.currentClass}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Session / Term</span>
                        <span class="detail-value">${data.term.sessionName} - ${data.term.name}</span>
                    </div>
                </div>
                ${data.school.stampUrl ? `<img src="${data.school.stampUrl}" style="height:90px;width:90px;opacity:0.8;margin-left:20px;" alt="Stamp" />` : ''}
            </div>

            <div class="summary-stats">
                <div class="stat-box">
                    <div class="stat-label">Total Score</div>
                    <div class="stat-value">${data.result.totalScore !== null ? data.result.totalScore.toFixed(2) : '-'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Final Grade</div>
                    <div class="stat-value">${data.result.grade || '-'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Position</div>
                    <div class="stat-value">${data.result.position || '-'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Attendance</div>
                    <div class="stat-value" style="font-size: 16px; line-height: 1.2; margin-top: 5px;">
                        ${data.attendance.daysPresent}/${data.term.totalSchoolDays}<br/>
                        <span style="font-size: 10px; font-weight: normal;">Days Present</span>
                    </div>
                </div>
            </div>

            <h3 class="section-title">Academic Performance</h3>
            <div class="performance-grid">
                ${data.subjectScores
                  .map(
                    (score) => `
                    <div class="subject-card">
                        <div class="subject-info">
                            <div class="subject-name">${score.name}</div>
                            <div class="subject-breakdown">
                                Assgn: ${score.assignments !== null ? score.assignments : '-'} | 
                                Tests: ${score.tests !== null ? score.tests : '-'} | 
                                Exam: ${score.exam !== null ? score.exam : '-'}
                            </div>
                        </div>
                        <div class="subject-score-box">
                            <span class="subject-total">${score.totalScore !== null ? score.totalScore : '-'}</span>
                            <span class="subject-grade">${score.grade || '-'}</span>
                        </div>
                    </div>
                `,
                  )
                  .join('')}
            </div>

            <div class="footer-section">
                <div class="remark-card">
                    <h4>Teacher's Remarks</h4>
                    <p class="remark-text">${data.result.classTeacherRemark || 'No remark provided.'}</p>
                    <div class="sign-area">
                        <div class="sign-line">${data.staff.classTeacherName || 'Sign'}</div>
                    </div>
                </div>
                <div class="remark-card">
                    <h4>Principal's Remarks</h4>
                    <p class="remark-text">${data.result.principalRemark || 'No remark provided.'}</p>
                    <div class="sign-area">
                        <div class="sign-line">${data.staff.principalName || 'Sign'}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

export const getReportCardTemplate = (
  templateKey: string | null,
): ((data: ReportCardData) => string) => {
  if (templateKey === 'modern') {
    return modernTemplate;
  }
  return classicTemplate;
};
