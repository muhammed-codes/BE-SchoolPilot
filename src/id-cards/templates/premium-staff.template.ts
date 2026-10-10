import { RenderCardContext, StaffCardData } from './id-card-data.interface';
import {
  escapeHtml,
  sanitizeUrl,
  getDefaultAvatarSvg,
  getDefaultLogoSvg,
} from './template-helpers';

export const renderPremiumStaffFront = (
  ctx: RenderCardContext<StaffCardData>,
): string => {
  const { school, cardData } = ctx;
  const primaryColor = school.primaryColor || '#0B3830';
  const accentColor = school.accentColor || '#C89D3C';
  const schoolName = escapeHtml(school.name || 'SchoolPilot Academy');
  const staffName = escapeHtml(cardData.fullName);
  const staffId = escapeHtml(cardData.staffId || '—');
  const designation = escapeHtml(
    cardData.designation || cardData.role.replace(/_/g, ' '),
  );
  const email = escapeHtml(cardData.email || '');
  const phone = escapeHtml(cardData.phone || '');

  const logoSrc = school.logoUrl
    ? sanitizeUrl(school.logoUrl)
    : getDefaultLogoSvg(school.name || 'SP');
  const photoSrc = cardData.avatarUrl
    ? sanitizeUrl(cardData.avatarUrl)
    : getDefaultAvatarSvg(cardData.fullName, '#F8FAFC', '#0B3830');

  return `
    <div class="premium-card premium-staff-front" style="
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
      <!-- Top Decorative Accent -->
      <div style="
        height: 1.2mm;
        background: linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%);
      "></div>

      <!-- Top Header -->
      <div style="
        padding: 2.2mm 3mm 1mm;
        display: flex;
        align-items: center;
        gap: 2mm;
      ">
        <img src="${logoSrc}" alt="School Logo" style="
          width: 7.5mm;
          height: 7.5mm;
          object-fit: contain;
          border-radius: 1.5mm;
          flex-shrink: 0;
          border: 0.2mm solid #E2E8F0;
        " />
        <div style="min-width: 0; flex: 1;">
          <div style="
            font-size: 2.3mm;
            font-weight: 800;
            color: #0F172A;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.15;
          ">${schoolName}</div>
          <div style="
            font-size: 1.5mm;
            font-weight: 700;
            color: ${accentColor};
            text-transform: uppercase;
            letter-spacing: 0.12em;
            margin-top: 0.3mm;
          ">Staff Credential</div>
        </div>
      </div>

      <!-- Main Photo & Identity Section -->
      <div style="
        padding: 1mm 3mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        flex: 1;
        justify-content: space-evenly;
      ">
        <!-- Photo Container with Accent Ring -->
        <div style="
          width: 24mm;
          height: 25.5mm;
          border-radius: 2mm;
          padding: 0.5mm;
          background: linear-gradient(135deg, ${accentColor} 0%, ${primaryColor} 100%);
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 100%;
            height: 100%;
            border-radius: 1.6mm;
            overflow: hidden;
            background: #F8FAFC;
          ">
            <img src="${photoSrc}" alt="Staff" style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            " />
          </div>
        </div>

        <!-- Name & Designation -->
        <div style="width: 100%; margin-top: 0.8mm;">
          <div style="
            font-size: 3.2mm;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.01em;
            line-height: 1.15;
            max-height: 6.8mm;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          ">${staffName}</div>

          <div style="
            display: inline-block;
            margin-top: 0.8mm;
            padding: 0.4mm 2.2mm;
            background: #0F172A;
            color: #FFFFFF;
            font-size: 1.9mm;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-radius: 999px;
          ">${designation}</div>
        </div>

        <!-- Detail Grid -->
        <div style="
          width: 100%;
          background: #F8FAFC;
          border: 0.25mm solid #E2E8F0;
          border-radius: 1.2mm;
          padding: 1.2mm 2mm;
          font-size: 1.9mm;
          margin-top: 0.8mm;
        ">
          <div style="display: flex; justify-content: space-between; ${phone || email ? 'margin-bottom: 0.5mm;' : ''}">
            <span style="color: #64748B; font-weight: 500;">Staff ID</span>
            <span style="font-family: monospace; font-weight: 800; color: #0F172A;">${staffId}</span>
          </div>
          ${
            phone
              ? `
          <div style="display: flex; justify-content: space-between; ${email ? 'margin-bottom: 0.5mm;' : ''}">
            <span style="color: #64748B; font-weight: 500;">Phone</span>
            <span style="font-family: monospace; font-weight: 600; color: #0F172A; max-width: 26mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${phone}</span>
          </div>
          `
              : ''
          }
          ${
            email
              ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B; font-weight: 500;">Official Email</span>
            <span style="font-weight: 600; color: #0F172A; max-width: 26mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${email}</span>
          </div>
          `
              : ''
          }
        </div>
      </div>

      <!-- Bottom Security Tag -->
      <div style="
        background: #0F172A;
        color: #F8FAFC;
        padding: 1.2mm 3mm;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 1.6mm;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      ">
        <span>Authorized Personnel</span>
        <span style="color: ${accentColor}; font-weight: 800;">CR80 Verified</span>
      </div>
    </div>
  `;
};

export const renderPremiumStaffBack = (
  ctx: RenderCardContext<StaffCardData>,
): string => {
  const { school, options } = ctx;
  const primaryColor = school.primaryColor || '#0B3830';
  const accentColor = school.accentColor || '#C89D3C';
  const schoolName = escapeHtml(school.name || 'SchoolPilot Academy');
  const address = escapeHtml(school.address || 'Institution Premises');
  const phone = escapeHtml(school.phone || '');
  const email = escapeHtml(school.email || '');
  const customNote = escapeHtml(
    options.customNote ||
      `This official credential is property of ${school.name || 'the institution'}. The bearer is an authorized faculty/staff member. Return immediately if found.`,
  );
  const qrCodeDataUrl = options.qrCodeDataUrl || '';

  return `
    <div class="premium-card premium-staff-back" style="
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
      <!-- Top Accent Rule -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1.2mm;
        background: linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%);
      "></div>

      <!-- Header -->
      <div style="margin-top: 1mm; border-bottom: 0.25mm solid #E2E8F0; padding-bottom: 1.5mm;">
        <div style="
          font-size: 2.4mm;
          font-weight: 800;
          color: #0F172A;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.1;
        ">${schoolName}</div>
        <div style="
          font-size: 1.5mm;
          color: ${accentColor};
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.4mm;
        ">Staff Security Credential</div>
      </div>

      <!-- Disclaimer Panel -->
      <div style="
        font-size: 1.7mm;
        line-height: 1.35;
        color: #475569;
        text-align: justify;
        background: #F8FAFC;
        border: 0.25mm solid #E2E8F0;
        border-radius: 1mm;
        padding: 1.5mm 2mm;
        margin: 1.2mm 0;
      ">
        ${customNote}
      </div>

      <!-- QR Section -->
      ${
        options.showQrCode && qrCodeDataUrl
          ? `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0.8mm 0;
      ">
        <div style="
          padding: 1.2mm;
          background: #FFFFFF;
          border: 0.3mm solid #CBD5E1;
          border-radius: 1.2mm;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          display: inline-block;
        ">
          <img src="${qrCodeDataUrl}" alt="QR Code" style="
            width: 17mm;
            height: 17mm;
            display: block;
          " />
        </div>
        <div style="
          font-size: 1.4mm;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 0.8mm;
        ">Scan for verification & clock-in</div>
      </div>
      `
          : ''
      }

      <!-- Contact and Signature -->
      <div style="border-top: 0.25mm solid #E2E8F0; padding-top: 1.4mm; font-size: 1.6mm; color: #64748B; line-height: 1.3;">
        ${options.showSchoolAddress && address ? `<div>${address}</div>` : ''}
        ${phone || email ? `<div style="font-weight: 600; color: #334155; margin-top: 0.3mm;">${[phone, email].filter(Boolean).join(' • ')}</div>` : ''}

        ${
          options.showPrincipalSignature
            ? `
        <div style="margin-top: 1.8mm; display: flex; justify-content: flex-end;">
          <div style="text-align: center; width: 22mm;">
            <div style="border-bottom: 0.25mm solid #0F172A; height: 2.8mm;"></div>
            <div style="font-size: 1.4mm; font-weight: 700; color: #0F172A; margin-top: 0.4mm; text-transform: uppercase;">Managing Director</div>
          </div>
        </div>
        `
            : ''
        }
      </div>
    </div>
  `;
};
