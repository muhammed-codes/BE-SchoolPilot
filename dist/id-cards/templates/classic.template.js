"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classicTemplate = void 0;
const classicTemplate = (data) => {
    const isStudent = 'admissionNumber' in data;
    const name = isStudent ? data.studentName : data.staffName;
    const idNumber = isStudent ? data.admissionNumber : data.staffId;
    const subtitle = isStudent ? data.className : data.role.replace(/_/g, ' ');
    const photo = data.photoBase64;
    const logo = data.schoolLogoBase64;
    const schoolName = data.schoolName;
    const qr = data.qrCodeBase64;
    const session = data.session;
    return `
    <div style="
      width: 85.6mm; height: 54mm; box-sizing: border-box;
      border: 1px solid #E2E8F0; border-radius: 3mm;
      font-family: Arial, Helvetica, sans-serif;
      overflow: hidden; background: #FFFFFF; position: relative;
    ">
      <div style="
        background: #1A56A8; height: 14mm; display: flex;
        align-items: center; padding: 0 3mm;
      ">
        <img src="${logo}" style="width: 10mm; height: 10mm; border-radius: 50%; object-fit: cover; background: #fff;" />
        <div style="flex: 1; text-align: center; color: #FFFFFF; font-size: 9pt; font-weight: 700; padding: 0 2mm;">
          ${schoolName}
        </div>
      </div>

      <div style="display: flex; padding: 2mm 3mm 0 3mm; height: 28mm;">
        <div style="flex-shrink: 0; width: 22mm; height: 26mm; margin-right: 3mm;">
          <img src="${photo}" style="
            width: 22mm; height: 26mm; border-radius: 2mm;
            object-fit: cover; border: 1px solid #E2E8F0;
          " />
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 10pt; font-weight: 700; color: #1E293B; margin-bottom: 1mm; line-height: 1.2;">
            ${name}
          </div>
          <div style="font-size: 7.5pt; color: #64748B; margin-bottom: 0.5mm; text-transform: capitalize;">
            ${subtitle}
          </div>
          <div style="font-size: 7.5pt; color: #334155; margin-bottom: 0.5mm;">
            <span style="font-weight: 600;">ID:</span> ${idNumber}
          </div>
        </div>
      </div>

      <div style="
        position: absolute; bottom: 0; left: 0; right: 0;
        background: #F1F5F9; height: 10mm; display: flex;
        align-items: center; justify-content: space-between;
        padding: 0 3mm; border-top: 1px solid #E2E8F0;
      ">
        <div style="font-size: 6pt; color: #64748B;">Valid: ${session}</div>
        <img src="${qr}" style="width: 9mm; height: 9mm;" />
      </div>
    </div>
  `;
};
exports.classicTemplate = classicTemplate;
//# sourceMappingURL=classic.template.js.map