import { ReportCardData } from './report-card-data.interface';

const toOrdinal = (n: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = n % 100;
  return `${n}${suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]}`;
};

const getDisplayPosition = (position: number | null) => {
  if (!position || position > 3) return 'N/A';
  return toOrdinal(position);
};

const escapeHtml = (unsafe: string): string => {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatComponentLabel = (component: string, maxScore: number) => {
  const normalized = (component || '')
    .replace(/[_-]/g, ' ')
    .trim()
    .toUpperCase();
  const scoreText = Number.isFinite(maxScore) ? ` /${maxScore}` : '';
  return escapeHtml(`${normalized}${scoreText}`);
};

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
            border: 1px solid #dbe5f3;
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 12px;
            background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }
        .logo {
            width: 56px;
            height: 56px;
            object-fit: contain;
            margin-right: 12px;
        }
        .school-info {
            flex-grow: 1;
            min-width: 0;
        }
        .school-name {
            font-size: 24px;
            line-height: 1.1;
            font-weight: 800;
            color: #1A56A8;
            margin: 0;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .school-address {
            font-size: 12px;
            color: #555;
            margin: 2px 0 0 0;
            line-height: 1.3;
        }
        .report-title {
            text-align: center;
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 12px;
            background: linear-gradient(90deg, #f4f7fc 0%, #eef3fb 100%);
            border: 1px solid #e1e8f4;
            padding: 8px 12px;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 0.9px;
            color: #1f2e44;
        }
        .student-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 96px;
            gap: 10px;
            margin-bottom: 16px;
        }
        .info-group {
            border: 1px solid #e1e8f4;
            background: #fbfcff;
            padding: 10px 12px;
            border-radius: 8px;
        }
        .info-row {
            display: flex;
            margin-bottom: 5px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 700;
            width: 110px;
            color: #3d4f69;
        }
        .student-photo {
            width: 96px;
            height: 96px;
            object-fit: cover;
            border: 1px solid #d7dfed;
            border-radius: 8px;
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
        .remark-lines {
            margin-top: 8px;
        }
        .remark-line {
            border-bottom: 1px solid #8b8b8b;
            height: 22px;
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
        <div style="padding: 6px 10px; border: 1px solid #d9e3f2; border-radius: 999px; font-size: 10px; font-weight: 700; color: #1A56A8; white-space: nowrap;">${data.term.sessionName} • ${data.term.name}</div>
    </div>

    <div class="report-title">
        STUDENT TERMINAL REPORT CARD
    </div>

    <div class="student-info-grid">
        <div class="info-group">
            <div class="info-row"><span class="info-label">Name:</span> <span>${data.student.fullName}</span></div>
            <div class="info-row"><span class="info-label">Admission No:</span> <span>${data.student.admissionNumber}</span></div>
            <div class="info-row"><span class="info-label">Class:</span> <span>${data.student.currentClass}</span></div>
            <div class="info-row"><span class="info-label">Position:</span> <span>${getDisplayPosition(data.result.position)}</span></div>
        </div>
        <div class="info-group">
            <div class="info-row"><span class="info-label">Session:</span> <span>${data.term.sessionName}</span></div>
            <div class="info-row"><span class="info-label">Term:</span> <span>${data.term.name}</span></div>
            <div class="info-row"><span class="info-label">Total Score:</span> <span>${data.result.totalScore !== null ? data.result.totalScore.toFixed(2) : 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Percentage:</span> <span>${data.result.percentage !== null ? `${data.result.percentage.toFixed(2)}%` : 'N/A'}</span></div>
        </div>
        <div>
            ${data.student.passportPhotoUrl ? `<img src="${data.student.passportPhotoUrl}" class="student-photo" alt="Student Photo" />` : '<div class="student-photo" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No Photo</div>'}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="text-align: left;">Subject</th>
                ${data.scoreComponents
                  .map(
                    (component) =>
                      `<th>${formatComponentLabel(component.component, component.maxScore)}</th>`,
                  )
                  .join('')}
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
                    ${score.componentScores
                      .map(
                        (componentScore) =>
                          `<td>${componentScore.score !== null ? componentScore.score : '-'}</td>`,
                      )
                      .join('')}
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
            <div class="remark-lines">
                <div class="remark-line"></div>
                <div class="remark-line"></div>
                <div class="remark-line"></div>
            </div>
        </div>
        <div class="remark-box">
            <div class="remark-title">Principal's Remark</div>
            <div class="remark-lines">
                <div class="remark-line"></div>
                <div class="remark-line"></div>
                <div class="remark-line"></div>
            </div>
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
            margin-bottom: 20px;
            min-height: 40px;
        }
        .remark-line {
            border-bottom: 1px solid #a0aec0;
            height: 20px;
            margin-bottom: 10px;
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
                    <div class="stat-label">Percentage</div>
                    <div class="stat-value">${data.result.percentage !== null ? `${data.result.percentage.toFixed(2)}%` : '-'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Position</div>
                    <div class="stat-value">${getDisplayPosition(data.result.position)}</div>
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
                                ${score.componentScores
                                  .map((componentScore) => {
                                    const label = data.scoreComponents.find(
                                      (component) =>
                                        component.component ===
                                        componentScore.component,
                                    );
                                    const displayLabel = label
                                      ? formatComponentLabel(
                                          label.component,
                                          label.maxScore,
                                        )
                                      : escapeHtml(componentScore.component);
                                    return `${displayLabel}: ${componentScore.score !== null ? componentScore.score : '-'}`;
                                  })
                                  .join(' | ')}
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
                    <div class="remark-text">
                        <div class="remark-line"></div>
                        <div class="remark-line"></div>
                        <div class="remark-line"></div>
                    </div>
                    <div class="sign-area">
                        <div class="sign-line">${data.staff.classTeacherName || 'Sign'}</div>
                    </div>
                </div>
                <div class="remark-card">
                    <h4>Principal's Remarks</h4>
                    <div class="remark-text">
                        <div class="remark-line"></div>
                        <div class="remark-line"></div>
                        <div class="remark-line"></div>
                    </div>
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
