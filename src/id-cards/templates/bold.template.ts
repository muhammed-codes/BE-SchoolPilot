import {
  StudentCardData,
  StaffCardData,
} from '../interfaces/card-data.interface';
import { UserRole } from '../../common/enums';

const getAccentColor = (data: StudentCardData | StaffCardData): string => {
  if ('admissionNumber' in data) return '#1A56A8';
  const role = data.role;
  const colorMap: Record<string, string> = {
    [UserRole.PRINCIPAL]: '#7C3AED',
    [UserRole.CLASS_TEACHER]: '#059669',
    [UserRole.SUBJECT_TEACHER]: '#0891B2',
    [UserRole.SCHOOL_ADMIN]: '#1A56A8',
  };
  return colorMap[role] || '#1A56A8';
};

export const boldTemplate = (data: StudentCardData | StaffCardData): string => {
  const isStudent = 'admissionNumber' in data;
  const name = isStudent ? data.studentName : data.staffName;
  const idNumber = isStudent ? data.admissionNumber : data.staffId;
  const subtitle = isStudent ? data.className : data.role.replace(/_/g, ' ');
  const photo = data.photoBase64;
  const logo = data.schoolLogoBase64;
  const schoolName = data.schoolName;
  const qr = data.qrCodeBase64;
  const accent = getAccentColor(data);

  return `
    <div style="
      width: 85.6mm; height: 54mm; box-sizing: border-box;
      border-radius: 3mm; font-family: Arial, Helvetica, sans-serif;
      overflow: hidden; background: #0F172A; position: relative;
    ">
      <div style="
        position: absolute; top: 0; left: 0; bottom: 0; width: 2mm;
        background: ${accent};
      "></div>

      <div style="
        display: flex; align-items: center; justify-content: space-between;
        padding: 2mm 3mm 0 5mm;
      ">
        <div style="font-size: 7pt; color: #FFFFFF; font-weight: 700; max-width: 55mm; line-height: 1.2;">
          ${schoolName}
        </div>
        <img src="${logo}" style="width: 9mm; height: 9mm; border-radius: 50%; object-fit: cover; background: #fff;" />
      </div>

      <div style="display: flex; align-items: center; padding: 1.5mm 3mm 0 5mm;">
        <div style="flex-shrink: 0; margin-right: 3mm;">
          <img src="${photo}" style="
            width: 20mm; height: 24mm; border-radius: 2mm;
            object-fit: cover; border: 2px solid ${accent};
          " />
        </div>
        <div style="flex: 1;">
          <div style="font-size: 9.5pt; font-weight: 700; color: #FFFFFF; margin-bottom: 1mm; line-height: 1.2;">
            ${name}
          </div>
          <div style="font-size: 7pt; color: ${accent}; text-transform: capitalize; margin-bottom: 0.5mm; font-weight: 600;">
            ${subtitle}
          </div>
          <div style="font-size: 7pt; color: #94A3B8; margin-bottom: 1mm;">
            <span style="font-weight: 600; color: #CBD5E1;">ID:</span> ${idNumber}
          </div>
        </div>
      </div>

      <div style="
        position: absolute; bottom: 1.5mm; right: 3mm;
      ">
        <img src="${qr}" style="width: 10mm; height: 10mm; border-radius: 1mm;" />
      </div>
    </div>
  `;
};
