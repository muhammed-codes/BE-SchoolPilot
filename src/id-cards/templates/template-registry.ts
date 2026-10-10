import { IdCardType, IdCardOrientation, IdCardSide } from '../enums/id-card.enums';
import {
  RenderCardContext,
  StudentCardData,
  StaffCardData,
} from './id-card-data.interface';
import { BASE_CARD_CSS } from './template-helpers';
import {
  renderClassicStudentFront,
  renderClassicStudentBack,
} from './classic-student.template';
import {
  renderClassicStaffFront,
  renderClassicStaffBack,
} from './classic-staff.template';
import {
  renderPremiumStudentFront,
  renderPremiumStudentBack,
} from './premium-student.template';
import {
  renderPremiumStaffFront,
  renderPremiumStaffBack,
} from './premium-staff.template';

export interface TemplateDefinition {
  key: string;
  name: string;
  description: string;
  cardType: IdCardType;
  orientation: IdCardOrientation;
  widthMm: number;
  heightMm: number;
  version: string;
  isSystemDefault: boolean;
  hasBackSide: boolean;
  previewThumbnailUrl?: string;
  designConfiguration?: Record<string, unknown>;
  renderFront: (ctx: RenderCardContext<any>) => string;
  renderBack: (ctx: RenderCardContext<any>) => string;
}

export const SYSTEM_TEMPLATES: TemplateDefinition[] = [
  {
    key: 'classic-student',
    name: 'Classic Student ID',
    description:
      'Conventional, clean institutional student card with structured photo, admission data, and school branding.',
    cardType: IdCardType.STUDENT,
    orientation: IdCardOrientation.PORTRAIT,
    widthMm: 53.98,
    heightMm: 85.6,
    version: '1.0.0',
    isSystemDefault: true,
    hasBackSide: true,
    designConfiguration: {
      theme: 'classic',
      primaryColor: '#146356',
    },
    renderFront: renderClassicStudentFront,
    renderBack: renderClassicStudentBack,
  },
  {
    key: 'classic-staff',
    name: 'Classic Staff ID',
    description:
      'Standard faculty and staff identity card with prominent staff ID, designation badge, and institutional authorization.',
    cardType: IdCardType.STAFF,
    orientation: IdCardOrientation.PORTRAIT,
    widthMm: 53.98,
    heightMm: 85.6,
    version: '1.0.0',
    isSystemDefault: true,
    hasBackSide: true,
    designConfiguration: {
      theme: 'classic',
      primaryColor: '#146356',
    },
    renderFront: renderClassicStaffFront,
    renderBack: renderClassicStaffBack,
  },
  {
    key: 'premium-student',
    name: 'Modern Premium Student ID',
    description:
      'Contemporary student pass with dual-accent styling, refined typography, and high-contrast digital credential layout.',
    cardType: IdCardType.STUDENT,
    orientation: IdCardOrientation.PORTRAIT,
    widthMm: 53.98,
    heightMm: 85.6,
    version: '1.0.0',
    isSystemDefault: false,
    hasBackSide: true,
    designConfiguration: {
      theme: 'premium',
      primaryColor: '#0B3830',
      accentColor: '#C89D3C',
    },
    renderFront: renderPremiumStudentFront,
    renderBack: renderPremiumStudentBack,
  },
  {
    key: 'premium-staff',
    name: 'Modern Premium Staff ID',
    description:
      'Executive faculty credential with geometric metallic accents, modern typography, and clean security credentials.',
    cardType: IdCardType.STAFF,
    orientation: IdCardOrientation.PORTRAIT,
    widthMm: 53.98,
    heightMm: 85.6,
    version: '1.0.0',
    isSystemDefault: false,
    hasBackSide: true,
    designConfiguration: {
      theme: 'premium',
      primaryColor: '#0B3830',
      accentColor: '#C89D3C',
    },
    renderFront: renderPremiumStaffFront,
    renderBack: renderPremiumStaffBack,
  },
];

export const getTemplateDefinition = (key: string): TemplateDefinition | undefined => {
  return SYSTEM_TEMPLATES.find((t) => t.key === key);
};

export const getDefaultTemplateKey = (cardType: IdCardType): string => {
  const match = SYSTEM_TEMPLATES.find(
    (t) => t.cardType === cardType && t.isSystemDefault,
  );
  return match ? match.key : cardType === IdCardType.STUDENT ? 'classic-student' : 'classic-staff';
};

export const compileFullDocumentHtml = (
  cardsHtml: string[],
  title = 'ID Cards',
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${BASE_CARD_CSS}
  </style>
</head>
<body>
  <div class="id-cards-grid">
    ${cardsHtml
      .map((html) => `<div class="id-card-wrapper">${html}</div>`)
      .join('\n')}
  </div>
</body>
</html>
  `.trim();
};
