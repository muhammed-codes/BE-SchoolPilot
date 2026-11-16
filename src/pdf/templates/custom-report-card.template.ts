import {
  ReportCardData,
  ScoreComponentData,
  SubjectScoreData,
} from './report-card-data.interface';
import {
  ResultTemplateConfig,
  ResultTableColumnConfig,
  getDefaultResultTemplateConfig,
} from '../../results/templates/result-template-config.interface';

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const toOrdinal = (n: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = n % 100;
  return `${n}${suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]}`;
};

const getDisplayPosition = (position?: number | null) => {
  if (!position) return 'N/A';
  if (position > 3) return `${position}th`;
  return toOrdinal(position);
};

const getGradeRemark = (grade?: string | null): string => {
  const g = (grade || '').trim().toUpperCase();
  if (!g) return '—';
  if (g.startsWith('A')) return 'Excellent';
  if (g.startsWith('B')) return 'Very Good';
  if (g.startsWith('C')) return 'Credit';
  if (g.startsWith('D')) return 'Pass';
  if (g.startsWith('E')) return 'Fair';
  if (g.startsWith('F')) return 'Needs Improvement';
  return 'Satisfactory';
};

export const generateCustomReportCardHtml = (
  data: ReportCardData,
  customConfig?: Partial<ResultTemplateConfig> | null,
): string => {
  const defaults = getDefaultResultTemplateConfig(
    data.school.name,
    '#146356',
  );
  const cfg: ResultTemplateConfig = {
    branding: { ...defaults.branding, ...(customConfig?.branding || {}) },
    studentInfo: { ...defaults.studentInfo, ...(customConfig?.studentInfo || {}) },
    resultsTable: { ...defaults.resultsTable, ...(customConfig?.resultsTable || {}) },
    performanceSummary: {
      ...defaults.performanceSummary,
      ...(customConfig?.performanceSummary || {}),
    },
    commentsAndSignatures: {
      ...defaults.commentsAndSignatures,
      ...(customConfig?.commentsAndSignatures || {}),
    },
    footer: { ...defaults.footer, ...(customConfig?.footer || {}) },
    pageLayout: { ...defaults.pageLayout, ...(customConfig?.pageLayout || {}) },
  };

  const branding = cfg.branding;
  const studentInfo = cfg.studentInfo;
  const tableCfg = cfg.resultsTable;
  const summary = cfg.performanceSummary;
  const comments = cfg.commentsAndSignatures;
  const footer = cfg.footer;
  const layout = cfg.pageLayout;

  const primaryColor = branding.primaryColor || '#146356';
  const headerBg = branding.headerBackgroundColor || '#E4EEEA';
  const headerText = branding.headerTextColor || '#14201C';
  const tableHeaderBg = tableCfg.headerBackgroundColor || headerBg;
  const tableHeaderText = tableCfg.headerTextColor || headerText;
  const altRowBg = tableCfg.alternateRowColor || '#F9F8F5';
  const rowBg = tableCfg.rowBackgroundColor || '#FFFFFF';
  const textColor = tableCfg.textColor || '#14201C';
  const borderColor = tableCfg.borderColor || '#D8D5CB';

  const visibleColumns: ResultTableColumnConfig[] = (tableCfg.columns || [])
    .filter((col) => col.visible)
    .sort((a, b) => a.order - b.order);

  // Pagination calculation
  const allSubjects = data.subjectScores || [];
  const maxRows = layout.maxSubjectsPerPage > 0 ? layout.maxSubjectsPerPage : 14;
  const subjectPages: SubjectScoreData[][] = [];

  if (allSubjects.length === 0) {
    subjectPages.push([]);
  } else if (layout.tablePaginationMode === 'split-by-max-rows' || allSubjects.length > maxRows) {
    for (let i = 0; i < allSubjects.length; i += maxRows) {
      subjectPages.push(allSubjects.slice(i, i + maxRows));
    }
  } else {
    subjectPages.push(allSubjects);
  }

  const totalPages = subjectPages.length;

  // Performance calculations
  const totalMarks = data.result.totalScore != null ? Number(data.result.totalScore).toFixed(1) : '—';
  const avgMarks = data.result.percentage != null ? `${Number(data.result.percentage).toFixed(1)}%` : '—';
  const subjectsOffered = allSubjects.length;
  const benchmark = summary.passBenchmark || 50;
  const subjectsPassed = allSubjects.filter(
    (s) => s.totalScore != null && Number(s.totalScore) >= benchmark,
  ).length;
  const subjectsFailed = allSubjects.filter(
    (s) => s.totalScore != null && Number(s.totalScore) < benchmark,
  ).length;

  const renderHeader = () => `
    <div class="report-header" style="background:${headerBg};color:${headerText};border-color:${borderColor};">
      <div class="header-inner header-${branding.headerAlignment || 'left'}">
        ${
          branding.showLogo && data.school.logoUrl
            ? `<div class="school-logo-wrap" style="width:${branding.logoWidth || 64}px;">
                <img src="${esc(data.school.logoUrl)}" alt="Logo" class="school-logo" />
              </div>`
            : ''
        }
        <div class="school-details">
          ${
            branding.showSchoolName
              ? `<h1 class="school-name" style="color:${primaryColor};">${esc(branding.customSchoolName || data.school.name)}</h1>`
              : ''
          }
          ${
            branding.showAddress && data.school.address
              ? `<div class="school-address">${esc(branding.customAddress || data.school.address)}</div>`
              : ''
          }
          ${
            branding.showContactInfo && branding.contactInfoText
              ? `<div class="school-contact">${esc(branding.contactInfoText)}</div>`
              : ''
          }
          ${
            branding.headerText
              ? `<div class="school-motto-banner">${esc(branding.headerText)}</div>`
              : ''
          }
          <div class="report-title-badge" style="background:${primaryColor};">
            ${esc(branding.reportTitle || 'STUDENT ACADEMIC PERFORMANCE REPORT')}
          </div>
          ${
            branding.showSessionAndTerm
              ? `<div class="term-session-badge">${esc(data.term.sessionName)} • ${esc(data.term.name)}</div>`
              : ''
          }
        </div>
      </div>
    </div>
  `;

  const renderStudentInfo = () => `
    <div class="student-info-panel" style="border-color:${borderColor};">
      ${
        studentInfo.showPassportPhoto
          ? `<div class="student-photo-col ${studentInfo.photoPosition === 'right' ? 'order-last' : ''}">
              ${
                data.student.passportPhotoUrl
                  ? `<img src="${esc(data.student.passportPhotoUrl)}" class="student-photo" alt="Photo" />`
                  : `<div class="student-photo-placeholder">Passport</div>`
              }
            </div>`
          : ''
      }
      <div class="student-fields-grid ${studentInfo.layoutStyle || 'grid'}">
        ${
          studentInfo.showStudentName
            ? `<div class="field-item">
                <span class="field-label">${esc(studentInfo.nameLabel || 'Student Name')}</span>
                <span class="field-value font-bold">${esc(data.student.fullName)}</span>
              </div>`
            : ''
        }
        ${
          studentInfo.showAdmissionNumber
            ? `<div class="field-item">
                <span class="field-label">${esc(studentInfo.admissionNumberLabel || 'Admission No')}</span>
                <span class="field-value font-mono">${esc(data.student.admissionNumber || '—')}</span>
              </div>`
            : ''
        }
        ${
          studentInfo.showClass
            ? `<div class="field-item">
                <span class="field-label">${esc(studentInfo.classLabel || 'Class')}</span>
                <span class="field-value">${esc(data.student.currentClass)}</span>
              </div>`
            : ''
        }
        ${
          studentInfo.showTotalStudentsInClass && data.student.totalStudentsInClass
            ? `<div class="field-item">
                <span class="field-label">${esc(studentInfo.totalStudentsInClassLabel || 'Class Size')}</span>
                <span class="field-value">${data.student.totalStudentsInClass} students</span>
              </div>`
            : ''
        }
        ${
          studentInfo.showClassPosition && data.result.position
            ? `<div class="field-item">
                <span class="field-label">${esc(studentInfo.classPositionLabel || 'Position')}</span>
                <span class="field-value font-bold" style="color:${primaryColor};">${getDisplayPosition(data.result.position)}</span>
              </div>`
            : ''
        }
        ${
          studentInfo.showClassTeacher && data.staff.classTeacherName
            ? `<div class="field-item">
                <span class="field-label">${esc(studentInfo.classTeacherLabel || 'Form Teacher')}</span>
                <span class="field-value">${esc(data.staff.classTeacherName)}</span>
              </div>`
            : ''
        }
      </div>
    </div>
  `;

  const renderTable = (subjects: SubjectScoreData[], isSubsequentPage: boolean) => {
    const paddingClass = tableCfg.cellPadding === 'compact' ? 'pad-compact' : tableCfg.cellPadding === 'relaxed' ? 'pad-relaxed' : 'pad-normal';
    const fontClass = tableCfg.fontSize === 'xs' ? 'font-xs' : tableCfg.fontSize === 'md' ? 'font-md' : 'font-sm';

    return `
      <div class="results-table-container">
        ${
          isSubsequentPage
            ? `<div class="continuation-banner" style="color:${primaryColor};">Results continuation (${subjects.length} subjects)</div>`
            : ''
        }
        <table class="results-table ${paddingClass} ${fontClass}" style="border-color:${borderColor};color:${textColor};">
          <thead>
            <tr style="background:${tableHeaderBg};color:${tableHeaderText};border-color:${borderColor};">
              ${visibleColumns
                .map((col) => {
                  const widthStyle = col.widthPercent ? `width:${col.widthPercent}%;` : '';
                  const alignStyle = `text-align:${col.align || 'center'};`;
                  return `<th style="${widthStyle}${alignStyle}border-color:${borderColor};" class="${col.bold ? 'font-bold' : ''}">${esc(col.label)}</th>`;
                })
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${subjects
              .map((subject, rowIdx) => {
                const bg = rowIdx % 2 === 1 ? altRowBg : rowBg;
                return `
                  <tr style="background:${bg};border-color:${borderColor};">
                    ${visibleColumns
                      .map((col) => {
                        const alignStyle = `text-align:${col.align || 'center'};`;
                        let content = '—';

                        if (col.type === 'subject') {
                          content = `<span class="subject-name">${esc(subject.name)}</span>`;
                        } else if (col.type === 'component') {
                          const targetKey = (col.componentKey || col.label || '').toLowerCase().trim();
                          const matched = (subject.componentScores || []).find((cs) => {
                            const cKey = (cs.component || '').toLowerCase().trim();
                            return cKey === targetKey || cKey.includes(targetKey) || targetKey.includes(cKey);
                          });
                          content = matched?.score != null ? String(matched.score) : '—';
                        } else if (col.type === 'total') {
                          content = subject.totalScore != null ? `<strong>${subject.totalScore}</strong>` : '—';
                        } else if (col.type === 'grade') {
                          content = subject.grade ? `<span class="grade-pill font-bold" style="color:${primaryColor};">${esc(subject.grade)}</span>` : '—';
                        } else if (col.type === 'remark') {
                          content = esc(getGradeRemark(subject.grade));
                        }

                        return `<td style="${alignStyle}border-color:${borderColor};" class="${col.bold ? 'font-bold' : ''}">${content}</td>`;
                      })
                      .join('')}
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderSummary = () => `
    <div class="summary-section">
      <div class="summary-strip ${summary.layout || 'stat-strip'}" style="border-color:${borderColor};">
        ${
          summary.showTotalScore
            ? `<div class="summary-card" style="border-color:${borderColor};">
                <div class="stat-label">${esc(summary.totalScoreLabel || 'Total Score')}</div>
                <div class="stat-value font-mono font-bold" style="color:${primaryColor};">${totalMarks}</div>
              </div>`
            : ''
        }
        ${
          summary.showAverageScore
            ? `<div class="summary-card" style="border-color:${borderColor};">
                <div class="stat-label">${esc(summary.averageScoreLabel || 'Average')}</div>
                <div class="stat-value font-mono font-bold" style="color:${primaryColor};">${avgMarks}</div>
              </div>`
            : ''
        }
        ${
          summary.showOverallPosition && data.result.position
            ? `<div class="summary-card" style="border-color:${borderColor};">
                <div class="stat-label">${esc(summary.overallPositionLabel || 'Position')}</div>
                <div class="stat-value font-bold" style="color:${primaryColor};">${getDisplayPosition(data.result.position)}</div>
              </div>`
            : ''
        }
        ${
          summary.showSubjectsOffered
            ? `<div class="summary-card" style="border-color:${borderColor};">
                <div class="stat-label">${esc(summary.subjectsOfferedLabel || 'Subjects')}</div>
                <div class="stat-value font-mono">${subjectsOffered}</div>
              </div>`
            : ''
        }
        ${
          summary.showSubjectsPassed
            ? `<div class="summary-card" style="border-color:${borderColor};">
                <div class="stat-label">${esc(summary.subjectsPassedLabel || 'Passed')}</div>
                <div class="stat-value font-mono text-success">${subjectsPassed}</div>
              </div>`
            : ''
        }
        ${
          summary.showAttendanceSummary && data.attendance
            ? `<div class="summary-card" style="border-color:${borderColor};">
                <div class="stat-label">${esc(summary.attendanceLabel || 'Attendance')}</div>
                <div class="stat-value font-mono">${data.attendance.daysPresent}/${data.term.totalSchoolDays || 65}</div>
              </div>`
            : ''
        }
        ${
          summary.showNextTermResumption
            ? `<div class="summary-card" style="border-color:${borderColor};">
                <div class="stat-label">${esc(summary.nextTermResumptionLabel || 'Resumption')}</div>
                <div class="stat-value text-xs font-semibold">${esc(summary.resumptionDateText || 'Next Term')}</div>
              </div>`
            : ''
        }
      </div>
    </div>
  `;

  const renderComments = () => `
    <div class="remarks-grid" style="border-color:${borderColor};">
      ${
        comments.showClassTeacherRemark
          ? `<div class="remark-box" style="border-color:${borderColor};">
              <div class="remark-header" style="color:${primaryColor};">${esc(comments.classTeacherRemarkTitle || "Class Teacher's Remark")}</div>
              <div class="remark-content">${esc(data.result.classTeacherRemark || 'Satisfactory academic output and engagement.')}</div>
            </div>`
          : ''
      }
      ${
        comments.showPrincipalRemark
          ? `<div class="remark-box" style="border-color:${borderColor};">
              <div class="remark-header" style="color:${primaryColor};">${esc(comments.principalRemarkTitle || "Principal's Remark")}</div>
              <div class="remark-content">${esc(data.result.principalRemark || 'Promoted to the next class.')}</div>
            </div>`
          : ''
      }
    </div>
  `;

  const renderSignatures = () => `
    <div class="signatures-row" style="border-color:${borderColor};">
      ${
        comments.showClassTeacherSignature
          ? `<div class="sig-block">
              <div class="sig-line" style="border-color:${borderColor};">${esc(data.staff.classTeacherName || '')}</div>
              <div class="sig-role">${esc(comments.classTeacherRoleLabel || 'Class Teacher')}</div>
            </div>`
          : '<div></div>'
      }
      ${
        comments.showStamp
          ? `<div class="sig-stamp">
              ${
                data.school.stampUrl
                  ? `<img src="${esc(data.school.stampUrl)}" alt="Stamp" class="stamp-image" />`
                  : `<div class="stamp-box" style="border-color:${borderColor};color:${primaryColor};">OFFICIAL SEAL</div>`
              }
            </div>`
          : '<div></div>'
      }
      ${
        comments.showPrincipalSignature
          ? `<div class="sig-block">
              <div class="sig-line" style="border-color:${borderColor};">${esc(data.staff.principalName || 'Principal')}</div>
              <div class="sig-role">${esc(comments.principalRoleLabel || 'Principal')}</div>
            </div>`
          : '<div></div>'
      }
    </div>
  `;

  const renderFooter = (pageIndex: number, total: number) => `
    <div class="report-footer" style="border-color:${borderColor};text-align:${footer.footerAlignment || 'center'};">
      ${footer.showSchoolMotto && footer.schoolMottoText ? `<div class="footer-motto">“${esc(footer.schoolMottoText)}”</div>` : ''}
      ${footer.showFooter && footer.footerText ? `<div class="footer-text">${esc(footer.footerText)}</div>` : ''}
      ${
        footer.showPageNumbering
          ? `<div class="footer-page-number font-mono">Page ${pageIndex + 1} of ${total}</div>`
          : ''
      }
    </div>
  `;

  const pagesHtml = subjectPages.map((pageSubjects, pIdx) => {
    const isFirstPage = pIdx === 0;
    const isLastPage = pIdx === totalPages - 1;

    return `
      <div class="page-sheet" style="padding:${layout.marginTopMm || 12}mm ${layout.marginRightMm || 12}mm ${layout.marginBottomMm || 12}mm ${layout.marginLeftMm || 12}mm;">
        <div class="page-content-box" style="border-color:${borderColor};">
          ${isFirstPage ? renderHeader() : layout.repeatStudentInfoOnSubsequentPages ? renderHeader() : ''}
          ${isFirstPage ? renderStudentInfo() : layout.repeatStudentInfoOnSubsequentPages ? renderStudentInfo() : ''}
          ${renderTable(pageSubjects, !isFirstPage)}
          ${isLastPage ? renderSummary() : ''}
          ${isLastPage ? renderComments() : ''}
          ${isLastPage ? renderSignatures() : ''}
          ${renderFooter(pIdx, totalPages)}
        </div>
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(data.student.fullName)} — Academic Report Card</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    *::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      background: transparent !important;
    }
    html, body {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      font-family: ${branding.fontFamily || "'IBM Plex Sans', -apple-system, sans-serif"};
      color: ${textColor};
      background: #EFEFEF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      background: transparent !important;
    }
    @page {
      size: ${layout.paperSize || 'A4'} ${layout.orientation || 'portrait'};
      margin: 0;
    }
    .page-sheet {
      page-break-after: always;
      break-inside: avoid;
      background: #FFFFFF;
      min-height: 297mm;
      width: 210mm;
      margin: 0 auto 16px auto;
      display: flex;
      flex-direction: column;
    }
    @media print {
      body { background: #FFFFFF; }
      .page-sheet { margin: 0; box-shadow: none; width: 100%; min-height: 100vh; }
    }
    .page-sheet:last-child {
      page-break-after: auto;
    }
    .page-content-box {
      border: 1px solid ${borderColor};
      height: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 12px;
    }
    .report-header {
      border: 1px solid ${borderColor};
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .header-inner {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .header-center {
      flex-direction: column;
      text-align: center;
      justify-content: center;
    }
    .header-right {
      flex-direction: row-reverse;
      text-align: right;
    }
    .school-logo-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .school-logo {
      max-width: 100%;
      height: auto;
      max-height: 72px;
      object-fit: contain;
    }
    .school-details {
      flex: 1;
      min-width: 0;
    }
    .school-name {
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .school-address, .school-contact {
      font-size: 11px;
      opacity: 0.85;
      margin-top: 2px;
    }
    .school-motto-banner {
      font-size: 10.5px;
      font-style: italic;
      margin-top: 3px;
      opacity: 0.9;
    }
    .report-title-badge {
      display: inline-block;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 10px;
      margin-top: 6px;
    }
    .term-session-badge {
      font-size: 10.5px;
      font-weight: 600;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .student-info-panel {
      border: 1px solid ${borderColor};
      padding: 8px 12px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FAF9F6;
    }
    .student-photo-col {
      flex-shrink: 0;
    }
    .student-photo {
      width: 54px;
      height: 64px;
      object-fit: cover;
      border: 1px solid ${borderColor};
    }
    .student-photo-placeholder {
      width: 54px;
      height: 64px;
      border: 1px dashed ${borderColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #888;
    }
    .student-fields-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 12px;
    }
    .field-item {
      display: flex;
      flex-direction: column;
    }
    .field-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.04em;
    }
    .field-value {
      font-size: 11.5px;
      color: #111;
    }
    .font-bold { font-weight: 600; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; }
    .results-table-container {
      margin-bottom: 10px;
      flex: 1;
    }
    .continuation-banner {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .results-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid ${borderColor};
    }
    .results-table th, .results-table td {
      border: 1px solid ${borderColor};
    }
    .pad-compact th, .pad-compact td { padding: 4px 6px; }
    .pad-normal th, .pad-normal td { padding: 6px 8px; }
    .pad-relaxed th, .pad-relaxed td { padding: 8px 10px; }
    .font-xs { font-size: 10px; }
    .font-sm { font-size: 11px; }
    .font-md { font-size: 12px; }
    .subject-name { font-weight: 500; }
    .grade-pill { font-size: 11px; }
    .summary-section {
      margin-bottom: 10px;
    }
    .summary-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 6px;
    }
    .summary-card {
      border: 1px solid ${borderColor};
      padding: 6px 8px;
      text-align: center;
      background: #FAF9F6;
    }
    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 2px;
    }
    .stat-value {
      font-size: 13px;
    }
    .text-success { color: #146356; }
    .remarks-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .remark-box {
      border: 1px solid ${borderColor};
      padding: 8px 10px;
      background: #FFFFFF;
      min-height: 52px;
    }
    .remark-header {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .remark-content {
      font-size: 10.5px;
      line-height: 1.35;
      font-style: italic;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 8px 0;
      margin-bottom: 8px;
    }
    .sig-block {
      width: 140px;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid ${borderColor};
      padding-bottom: 4px;
      font-size: 11px;
      font-weight: 600;
      min-height: 20px;
    }
    .sig-role {
      font-size: 9.5px;
      text-transform: uppercase;
      color: #666;
      margin-top: 3px;
    }
    .sig-stamp {
      width: 80px;
      text-align: center;
    }
    .stamp-box {
      border: 1px dashed ${borderColor};
      padding: 8px 4px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .stamp-image {
      max-width: 70px;
      max-height: 60px;
      object-fit: contain;
    }
    .report-footer {
      border-top: 1px solid ${borderColor};
      padding-top: 6px;
      font-size: 9.5px;
      color: #777;
      margin-top: auto;
    }
    .footer-motto {
      font-style: italic;
      font-weight: 500;
      margin-bottom: 2px;
    }
    .footer-page-number {
      margin-top: 2px;
      font-size: 9px;
    }
  </style>
</head>
<body>
  ${pagesHtml.join('')}
</body>
</html>
`;
};
