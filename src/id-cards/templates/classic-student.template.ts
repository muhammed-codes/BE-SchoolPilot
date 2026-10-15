import { RenderCardContext, StudentCardData } from './id-card-data.interface';
import {
  escapeHtml,
  sanitizeUrl,
  optimizeCardPhotoUrl,
  getDefaultAvatarSvg,
  getDefaultLogoSvg,
} from './template-helpers';

export const renderClassicStudentFront = (
  ctx: RenderCardContext<StudentCardData>,
): string => {
  const { school, cardData } = ctx;
  const primaryColor = school.primaryColor || '#146356';
  const schoolName = escapeHtml(school.name || 'SchoolRight');
  const studentName = escapeHtml(cardData.fullName);
  const admissionNumber = escapeHtml(cardData.admissionNumber || '—');
  const className = escapeHtml(cardData.className || 'Unassigned');
  const gender = escapeHtml(cardData.gender || '—');
  const sessionName = escapeHtml(cardData.sessionName || '');

  const logoSrc = school.logoUrl
    ? sanitizeUrl(school.logoUrl)
    : getDefaultLogoSvg(school.name || 'SP');
  const photoSrc = cardData.passportPhotoUrl
    ? sanitizeUrl(optimizeCardPhotoUrl(cardData.passportPhotoUrl))
    : getDefaultAvatarSvg(cardData.fullName);

  return `
    <div class="classic-card classic-student-front" style="
      width: 53.98mm;
      height: 85.60mm;
      box-sizing: border-box;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #14201C;
    ">
      <!-- Top Institutional Banner -->
      <div style="
        background: ${primaryColor};
        color: #FFFFFF;
        padding: 2.2mm 2.5mm;
        display: flex;
        align-items: center;
        gap: 2mm;
        border-bottom: 0.5mm solid #0B3830;
      ">
        <img src="${logoSrc}" alt="Logo" style="
          width: 7mm;
          height: 7mm;
          object-fit: contain;
          border-radius: 1mm;
          background: #FFFFFF;
          padding: 0.4mm;
          flex-shrink: 0;
        " />
        <div style="min-width: 0; flex: 1;">
          <div style="
            font-size: 2.5mm;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.1;
          ">${schoolName}</div>
          <div style="
            font-size: 1.6mm;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            opacity: 0.9;
            margin-top: 0.3mm;
          ">Student Identity Card</div>
        </div>
      </div>

      <!-- Main Body: Photo & Name -->
      <div style="
        padding: 2mm 3mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        flex: 1;
        justify-content: space-evenly;
      ">
        <!-- Photo Container -->
        <div style="
          width: 23mm;
          height: 25mm;
          border: 0.4mm solid #CBD5E1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-radius: 1mm;
          overflow: hidden;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="${photoSrc}" alt="Student" loading="lazy" decoding="async" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          " />
        </div>

        <!-- Student Name & Class -->
        <div style="width: 100%; margin-top: 1mm;">
          <div style="
            font-size: 3.1mm;
            font-weight: 700;
            color: #0F172A;
            line-height: 1.15;
            max-height: 6.6mm;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          ">${studentName}</div>

          <div style="
            display: inline-block;
            margin-top: 1mm;
            padding: 0.4mm 2mm;
            background: #E3ECE9;
            color: ${primaryColor};
            font-size: 2mm;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-radius: 0.6mm;
            border: 0.2mm solid #CBD5E1;
          ">${className}</div>
        </div>

        <!-- Data Matrix -->
        <div style="
          width: 100%;
          background: #F8FAFC;
          border: 0.25mm solid #E2E8F0;
          border-radius: 0.8mm;
          padding: 1.2mm 2mm;
          font-size: 1.9mm;
          margin-top: 1mm;
        ">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.6mm;">
            <span style="color: #64748B; font-weight: 500;">Admission No:</span>
            <span style="font-family: monospace; font-weight: 700; color: #0F172A;">${admissionNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between; ${sessionName ? 'margin-bottom: 0.6mm;' : ''}">
            <span style="color: #64748B; font-weight: 500;">Gender:</span>
            <span style="font-weight: 600; color: #0F172A;">${gender}</span>
          </div>
          ${
            sessionName
              ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B; font-weight: 500;">Session:</span>
            <span style="font-weight: 600; color: #0F172A;">${sessionName}</span>
          </div>
          `
              : ''
          }
        </div>
      </div>

      <!-- Bottom Security Footer -->
      <div style="
        background: #F1F5F9;
        border-top: 0.3mm solid #E2E8F0;
        padding: 1.2mm 2.5mm;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 1.6mm;
        color: #64748B;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      ">
        <span>Verified Identity</span>
        <span style="color: ${primaryColor}; font-weight: 700;">SchoolRight</span>
      </div>
    </div>
  `;
};

export const renderClassicStudentBack = (
  ctx: RenderCardContext<StudentCardData>,
): string => {
  const { school, options } = ctx;
  const primaryColor = school.primaryColor || '#146356';
  const schoolName = escapeHtml(school.name || 'SchoolRight');
  const address = escapeHtml(school.address || 'Institution Premises');
  const phone = escapeHtml(school.phone || '');
  const email = escapeHtml(school.email || '');
  const customNote = escapeHtml(
    options.customNote ||
      `This card is the official property of ${school.name || 'the school'}. If lost and found, please return to the administration address indicated above.`,
  );
  const qrCodeDataUrl = options.qrCodeDataUrl || '';

  return `
    <div class="classic-card classic-student-back" style="
      width: 53.98mm;
      height: 85.60mm;
      box-sizing: border-box;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #14201C;
      padding: 3mm 3.5mm;
      text-align: center;
    ">
      <!-- Header -->
      <div style="border-bottom: 0.3mm solid #E2E8F0; padding-bottom: 1.5mm;">
        <div style="
          font-size: 2.4mm;
          font-weight: 800;
          color: ${primaryColor};
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.1;
        ">${schoolName}</div>
        <div style="
          font-size: 1.5mm;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 0.4mm;
        ">Official Student Credentials</div>
      </div>

      <!-- Terms & Conditions / Disclaimer -->
      <div style="
        font-size: 1.7mm;
        line-height: 1.35;
        color: #475569;
        text-align: justify;
        background: #F8FAFC;
        border: 0.2mm solid #E2E8F0;
        border-radius: 0.6mm;
        padding: 1.5mm 2mm;
        margin: 1.5mm 0;
      ">
        ${customNote}
      </div>

      <!-- QR Code & Verification -->
      ${
        options.showQrCode && qrCodeDataUrl
          ? `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 1mm 0;
      ">
        <div style="
          padding: 1mm;
          background: #FFFFFF;
          border: 0.25mm solid #CBD5E1;
          border-radius: 1mm;
          display: inline-block;
        ">
          <img src="${qrCodeDataUrl}" alt="Student ID QR code" style="
            width: 24mm;
            height: 24mm;
            display: block;
          " />
        </div>
        <div style="
          font-size: 1.4mm;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 0.8mm;
        ">Scan for student ID data</div>
      </div>
      `
          : ''
      }

      <!-- Contact Details & Signature -->
      <div style="border-top: 0.3mm solid #E2E8F0; padding-top: 1.5mm; font-size: 1.6mm; color: #64748B; line-height: 1.3;">
        ${options.showSchoolAddress && address ? `<div>${address}</div>` : ''}
        ${phone || email ? `<div style="font-weight: 600; color: #334155; margin-top: 0.4mm;">${[phone, email].filter(Boolean).join(' • ')}</div>` : ''}

        ${
          options.showPrincipalSignature
            ? `
        <div style="margin-top: 2mm; display: flex; justify-content: flex-end;">
          <div style="text-align: center; width: 22mm;">
            <div style="border-bottom: 0.25mm solid #334155; height: 3mm;"></div>
            <div style="font-size: 1.4mm; font-weight: 700; color: #334155; margin-top: 0.4mm; text-transform: uppercase;">Authorized Signatory</div>
          </div>
        </div>
        `
            : ''
        }
      </div>
    </div>
  `;
};
