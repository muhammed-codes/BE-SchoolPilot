import {
  ReportCardData,
  ScoreComponentData,
  SubjectScoreData,
} from './report-card-data.interface';

// ─── Design system tokens (SchoolRight design system) ──────────────────────────
const BRAND = {
  navy: '#146356', // Teal / Accent primary
  navyLight: '#E4EEEA', // Accent soft bg / Callout
  ink: '#14201C', // Ink 900 text primary & borders
  textSecondary: '#5B655F', // Ink 600 secondary text
  textMuted: '#9C9686', // Ink 400 muted text
  border: '#D8D5CB', // Tan border default
  surfaceMuted: '#F4F3EF', // Cream 100 page bg / Secondary surface
  white: '#FFFFFF', // Clean surface bg
  success: '#146356', // Positive role
  warning: '#B5762A', // Warning role
  error: '#8C4A3A', // Danger role
};

/** Above this subject count, switch to compact two-column layout so large
 * classes still fit one A4 page without clipping. At or below it, single column. */
const COMPACT_THRESHOLD = 12;

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

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatComponentLabel = (component: string, maxScore: number) => {
  const normalized = (component || '')
    .replace(/[_-]/g, ' ')
    .trim()
    .toUpperCase();
  const scoreText = Number.isFinite(maxScore) ? ` /${maxScore}` : '';
  return esc(`${normalized}${scoreText}`);
};

const gradeColor = (grade?: string | null) => {
  const g = (grade || '').trim().toUpperCase();
  if (!g) return BRAND.ink;
  if (g.startsWith('A')) return BRAND.success;
  if (g.startsWith('F')) return BRAND.error;
  if (g.startsWith('D') || g.startsWith('E')) return BRAND.warning;
  return BRAND.navy;
};

const getStyles = (): string => `
  * { box-sizing: border-box; border-radius: 0 !important; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: ${BRAND.ink};
    background: ${BRAND.surfaceMuted};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4;
    margin: 16mm 14mm;
  }
  .page {
    page-break-after: always;
    break-inside: avoid;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: ${BRAND.white};
    border: 1px solid ${BRAND.border};
    padding: 24px;
  }
  .page:last-child {
    page-break-after: auto;
  }
  .header-bar {
    display: flex;
    align-items: center;
    border: 1px solid ${BRAND.border};
    border-radius: 0;
    padding: 14px 18px;
    margin-bottom: 16px;
    background: ${BRAND.navyLight};
  }
  .logo {
    width: 60px; height: 60px;
    object-fit: contain;
    border-radius: 0;
    margin-right: 14px;
    background: ${BRAND.white};
    border: 1px solid ${BRAND.border};
  }
  .logo-fallback {
    width: 60px; height: 60px;
    border-radius: 0;
    margin-right: 14px;
    background: ${BRAND.navy};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${BRAND.white};
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 20px;
  }
  .school-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: ${BRAND.ink};
    margin: 0;
    letter-spacing: -0.02em;
  }
  .school-address {
    font-size: 12px;
    color: ${BRAND.textSecondary};
    margin: 3px 0 0 0;
  }
  .session-pill {
    margin-left: auto;
    padding: 6px 12px;
    border-radius: 0;
    border: 1px solid ${BRAND.navy};
    background: ${BRAND.navyLight};
    color: ${BRAND.navy};
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .info-bar {
    display: flex;
    align-items: center;
    gap: 18px;
    border: 1px solid ${BRAND.border};
    border-radius: 0;
    padding: 14px 18px;
    margin-bottom: 14px;
  }
  .student-photo, .photo-placeholder {
    width: 70px; height: 70px;
    border-radius: 0;
    object-fit: cover;
    border: 1px solid ${BRAND.border};
    flex-shrink: 0;
  }
  .photo-placeholder {
    background: ${BRAND.surfaceMuted};
    display: flex; align-items: center; justify-content: center;
    color: ${BRAND.textMuted};
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    text-align: center;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 20px;
    flex: 1;
    min-width: 0;
  }
  .info-item { min-width: 0; overflow: hidden; }
  .info-item-name {
    grid-column: 1 / -1;
    overflow: visible;
  }
  .info-item-name .info-value {
    overflow: visible;
    overflow-wrap: anywhere;
  }
  .info-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${BRAND.textSecondary};
    display: block;
    margin-bottom: 2px;
  }
  .info-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: ${BRAND.ink};
    display: block;
    min-width: 0;
    width: 100%;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stats-strip {
    display: flex;
    background: ${BRAND.navy};
    border-radius: 0;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .stat-box {
    flex: 1;
    padding: 14px 10px;
    text-align: center;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }
  .stat-box:last-child { border-right: none; }
  .stat-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${BRAND.navyLight};
    margin-bottom: 4px;
  }
  .stat-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: ${BRAND.white};
  }
  .section-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${BRAND.ink};
    margin-bottom: 8px;
  }
  .subjects-columns {
    display: flex;
    gap: 14px;
    margin-bottom: 16px;
    break-inside: avoid;
  }
  .subjects-col { flex: 1; min-width: 0; }
  .subjects-table {
    width: 100%;
    border-collapse: collapse;
    break-inside: avoid;
  }
  .subjects-table th {
    background: ${BRAND.surfaceMuted};
    color: ${BRAND.textSecondary};
    font-family: 'IBM Plex Mono', monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 500;
    border: 1px solid ${BRAND.border};
    text-align: center;
  }
  .subjects-table th.subj-head { text-align: left; }
  .subjects-table td {
    border: 1px solid ${BRAND.border};
    text-align: center;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
  }
  .subjects-table td.subj-name {
    text-align: left;
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
  }
  .subjects-table td.subj-total { font-weight: 700; font-family: 'IBM Plex Mono', monospace; }
  .subjects-table tr:nth-child(even) td { background: ${BRAND.surfaceMuted}; }

  /* Single-column, large */
  .table-lg th { font-size: 10px; padding: 9px 10px; }
  .table-lg td { font-size: 13px; padding: 9px 10px; }

  /* Two-column, compact */
  .table-sm th { font-size: 7.5px; padding: 4px 5px; }
  .table-sm td { font-size: 9.5px; padding: 4px 5px; }

  .footer-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: auto;
    padding-top: 14px;
    break-inside: avoid;
  }
  .remark-card {
    border: 1px solid ${BRAND.border};
    border-left: 2px solid ${BRAND.ink};
    border-radius: 0;
    padding: 14px 16px;
    background: ${BRAND.navyLight};
    break-inside: avoid;
  }
  .remark-card h4 {
    margin: 0 0 8px 0;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 500;
    text-transform: uppercase;
    color: ${BRAND.textSecondary};
    letter-spacing: 0.06em;
  }
  .remark-text {
    font-size: 12px;
    color: ${BRAND.ink};
    min-height: 40px;
    line-height: 1.5;
    font-style: italic;
  }
  .signatures {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 26px;
    break-inside: avoid;
  }
  .signature-block { text-align: center; width: 170px; }
  .signature-line {
    border-top: 1px solid ${BRAND.ink};
    margin-top: 38px;
    padding-top: 5px;
    font-weight: 600;
    font-size: 11px;
  }
  .signature-role {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    color: ${BRAND.textSecondary};
    margin-top: 2px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .stamp-img { max-width: 84px; max-height: 84px; opacity: 0.85; border-radius: 0; }
  .stamp-placeholder {
    height: 74px; width: 74px;
    border: 1px dashed ${BRAND.border};
    border-radius: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    color: ${BRAND.textMuted};
    text-align: center;
  }
`;

const renderSubjectTable = (
  subjects: SubjectScoreData[],
  scoreComponents: ScoreComponentData[],
  sizeClass: 'table-lg' | 'table-sm',
): string => `
  <table class="subjects-table ${sizeClass}">
    <thead>
      <tr>
        <th class="subj-head">Subject</th>
        ${scoreComponents
          .map((c) => `<th>${formatComponentLabel(c.component, c.maxScore)}</th>`)
          .join('')}
        <th>Total</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      ${subjects
        .map(
          (score) => `
        <tr>
          <td class="subj-name">${esc(score.name)}</td>
          ${score.componentScores
            .map(
              (cs) =>
                `<td>${cs.score != null ? cs.score : '-'}</td>`,
            )
            .join('')}
          <td class="subj-total">${score.totalScore != null ? score.totalScore : '-'}</td>
          <td style="font-weight:800;color:${gradeColor(score.grade)};">${esc(score.grade ?? '-')}</td>
        </tr>`,
        )
        .join('')}
    </tbody>
  </table>
`;

const renderPageContent = (data: ReportCardData): string => {
  const isCompact = data.subjectScores.length > COMPACT_THRESHOLD;
  const sizeClass = isCompact ? 'table-sm' : 'table-lg';

  const subjectsMarkup = isCompact
    ? (() => {
        const half = Math.ceil(data.subjectScores.length / 2);
        const left = data.subjectScores.slice(0, half);
        const right = data.subjectScores.slice(half);
        return `
          <div class="subjects-col">${renderSubjectTable(left, data.scoreComponents, sizeClass)}</div>
          <div class="subjects-col">${renderSubjectTable(right, data.scoreComponents, sizeClass)}</div>
        `;
      })()
    : `<div class="subjects-col">${renderSubjectTable(data.subjectScores, data.scoreComponents, sizeClass)}</div>`;

  const initials = esc(
    (data.school.name || 'SR')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  return `
  <div class="page">
    <div class="header-bar">
      ${
        data.school.logoUrl
          ? `<img src="${esc(data.school.logoUrl)}" class="logo" alt="Logo" />`
          : `<div class="logo-fallback">${initials}</div>`
      }
      <div style="min-width:0;">
        <h1 class="school-name">${esc(data.school.name)}</h1>
        <p class="school-address">${esc(data.school.address ?? '')}</p>
      </div>
      <div class="session-pill">${esc(data.term.sessionName)} &bull; ${esc(data.term.name)}</div>
    </div>

    <div class="info-bar">
      ${
        data.student.passportPhotoUrl
          ? `<img src="${esc(data.student.passportPhotoUrl)}" class="student-photo" alt="Photo" />`
          : '<div class="photo-placeholder">No Photo</div>'
      }
      <div class="info-grid">
        <div class="info-item info-item-name">
          <span class="info-label">Name</span>
          <span class="info-value">${esc(data.student.fullName)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Admission No</span>
          <span class="info-value">${esc(data.student.admissionNumber ?? 'N/A')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Class</span>
          <span class="info-value">${esc(data.student.currentClass)}</span>
        </div>
      </div>
    </div>

    <div class="stats-strip">
      <div class="stat-box">
        <div class="stat-label">Total Score</div>
        <div class="stat-value">${data.result.totalScore != null ? Number(data.result.totalScore).toFixed(2) : '-'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Percentage</div>
        <div class="stat-value">${data.result.percentage != null ? `${Number(data.result.percentage).toFixed(2)}%` : '-'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Position</div>
        <div class="stat-value">${getDisplayPosition(data.result.position)}${
          data.student.totalStudentsInClass
            ? `<span style="font-size:12px;font-weight:400;"> /${data.student.totalStudentsInClass}</span>`
            : ''
        }</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Attendance</div>
        <div class="stat-value" style="font-size:16px;">
          ${data.attendance?.daysPresent ?? '-'}/${data.term.totalSchoolDays ?? '-'}
        </div>
      </div>
    </div>

    <div class="section-title">Academic Performance</div>
    <div class="subjects-columns">
      ${subjectsMarkup}
    </div>

    <div class="footer-section">
      <div class="remark-card">
        <h4>Class Teacher's Remark</h4>
        <div class="remark-text">${esc(data.result.classTeacherRemark ?? '')}</div>
      </div>
      <div class="remark-card">
        <h4>Proprietor's Remark</h4>
        <div class="remark-text">${esc(data.result.principalRemark ?? '')}</div>
      </div>
    </div>

    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line">${esc(data.staff.classTeacherName ?? '')}</div>
        <div class="signature-role">Class Teacher</div>
      </div>
      <div>
        ${
          data.school.stampUrl
            ? `<img src="${esc(data.school.stampUrl)}" class="stamp-img" alt="Stamp" />`
            : '<div class="stamp-placeholder">Official Stamp</div>'
        }
      </div>
      <div class="signature-block">
        <div class="signature-line">${esc(data.staff.principalName ?? '')}</div>
        <div class="signature-role">Proprietor</div>
      </div>
    </div>
  </div>
  `;
};

export const standardSchoolRightTemplate = (data: ReportCardData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Report Card</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>${getStyles()}</style>
</head>
<body>
  ${renderPageContent(data)}
</body>
</html>
`;

export const getReportCardTemplate = (
  _templateKey: string | null,
): ((data: ReportCardData) => string) => {
  return standardSchoolRightTemplate;
};
