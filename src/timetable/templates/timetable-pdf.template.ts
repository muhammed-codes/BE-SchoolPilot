export interface TimetablePdfRenderData {
  schoolName: string;
  schoolAddress?: string;
  termName: string;
  title: string;
  subtitle?: string;
  viewType: 'SCHOOL' | 'CLASS' | 'TEACHER' | 'ROOM';
  days: { dayOfWeek: number; dayName: string }[];
  periods: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    orderIndex: number;
  }[];
  cells: {
    dayOfWeek: number;
    periodId: string;
    items: {
      subjectName: string;
      className: string;
      teacherName: string;
      roomName?: string;
      isDoublePeriod?: boolean;
    }[];
  }[];
}

export function renderTimetableHtml(data: TimetablePdfRenderData): string {
  const {
    schoolName,
    schoolAddress,
    termName,
    title,
    subtitle,
    days,
    periods,
    cells,
  } = data;

  const cellMap = new Map<string, (typeof data.cells)[0]['items']>();
  cells.forEach((c) => {
    cellMap.set(`${c.dayOfWeek}_${c.periodId}`, c.items);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${schoolName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap');

    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #F4F3EF;
      color: #14201C;
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      padding: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      background: #FFFFFF;
      border: 1px solid #14201C;
      padding: 20px;
    }

    .header {
      border-bottom: 2px solid #14201C;
      padding-bottom: 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .eyebrow {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #146356;
      margin-bottom: 4px;
    }

    .title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #14201C;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 11px;
      color: #5B655F;
      margin-top: 2px;
    }

    .meta-box {
      text-align: right;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
    }

    .meta-tag {
      display: inline-block;
      background: #E4EEEA;
      color: #146356;
      padding: 3px 8px;
      font-weight: 700;
      margin-bottom: 4px;
      border: 1px solid #146356;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 10px;
    }

    th, td {
      border: 1px solid #D8D5CB;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #F4F3EF;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #14201C;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th.period-col {
      width: 90px;
      background: #EFEFEA;
      border-right: 2px solid #14201C;
    }

    .period-time {
      display: block;
      font-size: 9px;
      color: #5B655F;
      font-weight: 400;
      margin-top: 2px;
    }

    .slot-item {
      background: #FAF9F6;
      border-left: 3px solid #146356;
      padding: 4px 6px;
      margin-bottom: 4px;
    }

    .slot-subject {
      font-weight: 600;
      font-size: 11px;
      color: #14201C;
    }

    .slot-details {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      color: #5B655F;
      margin-top: 2px;
    }

    .badge-double {
      display: inline-block;
      font-size: 8px;
      font-weight: 700;
      background: #26324A;
      color: #FFFFFF;
      padding: 1px 4px;
      margin-left: 4px;
    }

    .footer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #D8D5CB;
      display: flex;
      justify-content: space-between;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      color: #9C9686;
    }

    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .container {
        border: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="eyebrow">${schoolName} • Timetable Master Sheet</div>
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle || ''} ${schoolAddress ? `• ${schoolAddress}` : ''}</div>
      </div>
      <div class="meta-box">
        <div class="meta-tag">${termName}</div>
        <div>Generated: ${new Date().toLocaleDateString('en-GB')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="period-col">Period / Time</th>
          ${days.map((d) => `<th>${d.dayName}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${periods
          .map(
            (p) => `
          <tr>
            <td class="period-col">
              <strong>${p.name}</strong>
              <span class="period-time">${p.startTime} – ${p.endTime}</span>
            </td>
            ${days
              .map((d) => {
                const items = cellMap.get(`${d.dayOfWeek}_${p.id}`) || [];
                if (items.length === 0) {
                  return '<td></td>';
                }
                return `<td>
                  ${items
                    .map(
                      (it) => `
                    <div class="slot-item">
                      <div class="slot-subject">
                        ${it.subjectName}
                        ${it.isDoublePeriod ? '<span class="badge-double">2X</span>' : ''}
                      </div>
                      <div class="slot-details">
                        ${it.className ? `<span>${it.className}</span> • ` : ''}
                        <span>${it.teacherName}</span>
                        ${it.roomName ? ` • <span>[${it.roomName}]</span>` : ''}
                      </div>
                    </div>
                  `,
                    )
                    .join('')}
                </td>`;
              })
              .join('')}
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <div class="footer">
      <span>SchoolPilot Official Academic Reference Sheet</span>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`;
}
