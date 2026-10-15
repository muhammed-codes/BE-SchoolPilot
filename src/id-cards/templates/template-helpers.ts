export const escapeHtml = (unsafe: string | null | undefined): string => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  ) {
    return escapeHtml(trimmed);
  }
  return '';
};

export const optimizeCardPhotoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname !== 'res.cloudinary.com' &&
      !parsed.hostname.endsWith('.res.cloudinary.com')
    ) {
      return url;
    }
    const uploadMarker = '/image/upload/';
    const uploadIndex = parsed.pathname.indexOf(uploadMarker);
    if (uploadIndex < 0) return url;

    const transformIndex = uploadIndex + uploadMarker.length;
    const nextPathSegment = parsed.pathname.slice(transformIndex).split('/')[0];
    if (nextPathSegment.includes(',')) return url;

    const pathBeforeTransform = parsed.pathname.slice(0, transformIndex);
    const originalPhotoPath = parsed.pathname.slice(transformIndex);
    const cardPhotoTransform = 'c_fill,w_360,h_400,q_auto,f_auto';
    parsed.pathname =
      `${pathBeforeTransform}${cardPhotoTransform}/${originalPhotoPath}`;
    return parsed.toString();
  } catch {
    return url;
  }
};

export const getInitials = (name: string): string => {
  if (!name) return 'SP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getDefaultAvatarSvg = (
  name: string,
  bg = '#E3ECE9',
  fg = '#146356',
): string => {
  const initials = escapeHtml(getInitials(name));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/><text x="50" y="58" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="34" font-weight="700" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

export const getDefaultLogoSvg = (name: string): string => {
  const initials = escapeHtml(getInitials(name));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" rx="6" fill="#146356"/><text x="30" y="35" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

export const BASE_CARD_CSS = `
  /* Exact CR80 dimensions: 53.98mm x 85.60mm */
  .id-card-wrapper,
  .id-card-wrapper *,
  .id-card-wrapper *::before,
  .id-card-wrapper *::after,
  .classic-card,
  .classic-card *,
  .premium-card,
  .premium-card * {
    box-sizing: border-box;
  }

  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  .id-cards-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6mm;
    justify-content: center;
    padding: 6mm 0;
  }

  .id-card-wrapper {
    width: 53.98mm;
    height: 85.60mm;
    min-width: 53.98mm;
    min-height: 85.60mm;
    max-width: 53.98mm;
    max-height: 85.60mm;
    position: relative;
    page-break-inside: avoid;
    break-inside: avoid;
    overflow: hidden;
    border-radius: 3.18mm;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    background: #FFFFFF;
  }

  @media print {
    body {
      background: #FFFFFF !important;
    }
    .id-cards-grid {
      padding: 0;
      gap: 5mm;
      justify-content: flex-start;
    }
    .id-card-wrapper {
      box-shadow: none !important;
      border: 0.2mm solid #E2E8F0;
    }
  }
`;
