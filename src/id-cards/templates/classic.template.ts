import {
  StudentCardData,
  StaffCardData,
} from '../interfaces/card-data.interface';

export const classicTemplate = (
  data: StudentCardData | StaffCardData,
): string => {
  const isStudent = 'admissionNumber' in data;
  const name = isStudent ? data.studentName : data.staffName;
  const idNumber = isStudent ? data.admissionNumber : data.staffId;
  const subtitle = isStudent ? data.className : data.role.replace(/_/g, ' ');
  const photo = data.photoBase64;
  const logo = data.schoolLogoBase64;
  const schoolName = data.schoolName;
  const qr = data.qrCodeBase64;
  const session = data.session;

  const dob = isStudent ? (data as StudentCardData).dateOfBirth : null;
  const gender = isStudent ? (data as StudentCardData).gender : null;
  const address = isStudent ? (data as StudentCardData).address : null;

  const infoRow = (label: string, value: string) => `
    <tr>
      <td style="
        font-size: 6pt; color: #64748B; font-weight: 600;
        padding: 0.6mm 0; white-space: nowrap; width: 14mm;
        vertical-align: top;
      ">${label}</td>
      <td style="
        font-size: 6pt; color: #334155; padding: 0.6mm 0 0.6mm 1mm;
        vertical-align: top; line-height: 1.3;
      ">${value}</td>
    </tr>
  `;

  return `
    <div style="
      width: 85.6mm; height: 54mm; box-sizing: border-box;
      border-radius: 3mm; font-family: Arial, Helvetica, sans-serif;
      overflow: hidden; position: relative; background: #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    ">

      <div style="
        background: linear-gradient(135deg, #0891B2 0%, #164E63 60%, #0C3547 100%);
        height: 15mm; display: flex; align-items: center;
        padding: 0 3mm; gap: 2mm; position: relative; overflow: hidden;
      ">
        <div style="
          position: absolute; right: -4mm; top: -4mm;
          width: 16mm; height: 16mm; border-radius: 50%;
          background: rgba(255,255,255,0.08);
        "></div>
        <div style="
          position: absolute; right: 3mm; top: -6mm;
          width: 10mm; height: 10mm; border-radius: 50%;
          background: rgba(255,255,255,0.06);
        "></div>

        <div style="
          width: 9mm; height: 9mm; border-radius: 50%;
          background: #FFFFFF; overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(255,255,255,0.4);
        ">
          <img src="${logo}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>

        <div style="flex: 1; min-width: 0;">
          <div style="
            font-size: 7pt; font-weight: 700; color: #FFFFFF;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            line-height: 1.3;
          ">${schoolName}</div>
          <div style="
            font-size: 5.5pt; color: rgba(255,255,255,0.75);
            font-weight: 500; margin-top: 0.3mm;
          ">${isStudent ? 'STUDENT IDENTITY CARD' : 'STAFF IDENTITY CARD'}</div>
        </div>

        <div style="
          background: rgba(255,255,255,0.18); border-radius: 1.5mm;
          padding: 0.6mm 1.5mm; flex-shrink: 0;
        ">
          <div style="font-size: 5.5pt; color: #FFFFFF; font-weight: 700;">${session}</div>
        </div>
      </div>

      <div style="
        display: flex; padding: 2mm 3mm; gap: 2.5mm; height: 30mm;
        background: #FFFFFF;
      ">
        <div style="flex-shrink: 0;">
          <div style="
            width: 18mm; height: 21mm; border-radius: 1.5mm; overflow: hidden;
            border: 1.5px solid #0891B2;
          ">
            <img src="${photo}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>

        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
          <div style="
            font-size: 8.5pt; font-weight: 800; color: #164E63;
            line-height: 1.2; margin-bottom: 1.2mm;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          ">${name}</div>

          <div style="
            display: inline-block; background: #ECFEFF; border-radius: 1mm;
            padding: 0.3mm 1.5mm; margin-bottom: 1.5mm;
          ">
            <span style="
              font-size: 5.5pt; color: #0891B2; font-weight: 700;
              text-transform: uppercase;
            ">${subtitle}</span>
          </div>

          <table style="border-collapse: collapse; width: 100%;">
            ${infoRow('Adm. No', idNumber)}
            ${dob ? infoRow('D.O.B', dob) : ''}
            ${gender ? infoRow('Gender', gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()) : ''}
            ${address ? infoRow('Address', address.length > 28 ? address.substring(0, 28) + '...' : address) : ''}
          </table>
        </div>

        <div style="
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        ">
          <img src="${qr}" style="width: 11mm; height: 11mm;" />
        </div>
      </div>

      <div style="
        height: 9mm;
        background: linear-gradient(90deg, #164E63 0%, #0891B2 100%);
        display: flex; align-items: center; padding: 0 3mm;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 1.5mm;">
          <div style="width: 1mm; height: 4mm; background: rgba(255,255,255,0.5); border-radius: 0.5mm;"></div>
          <div style="width: 1mm; height: 6mm; background: #FFFFFF; border-radius: 0.5mm;"></div>
          <div style="width: 1mm; height: 4mm; background: rgba(255,255,255,0.5); border-radius: 0.5mm;"></div>
        </div>
        <div style="font-size: 5.5pt; color: rgba(255,255,255,0.85); font-weight: 500; text-align: center;">
          If found, please return to the school
        </div>
        <div style="font-size: 5.5pt; color: rgba(255,255,255,0.9); font-weight: 600;">
          ${session}
        </div>
      </div>

    </div>
  `;
};
