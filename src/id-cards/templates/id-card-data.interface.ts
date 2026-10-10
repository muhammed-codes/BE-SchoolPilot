import { IdCardSide } from '../enums/id-card.enums';

export interface SchoolBrandingData {
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  schoolCode?: string | null;
  stampUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export interface StudentCardData {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName: string;
  admissionNumber: string;
  className?: string | null;
  passportPhotoUrl?: string | null;
  gender?: string | null;
  sessionName?: string | null;
}

export interface StaffCardData {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  staffId: string;
  role: string;
  designation: string;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface IdCardRenderOptions {
  side: IdCardSide;
  showQrCode: boolean;
  showSchoolAddress: boolean;
  showPrincipalSignature: boolean;
  customNote?: string | null;
  qrCodeDataUrl?: string;
}

export interface RenderCardContext<T = StudentCardData | StaffCardData> {
  school: SchoolBrandingData;
  cardData: T;
  options: IdCardRenderOptions;
}
