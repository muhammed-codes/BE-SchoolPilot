import { registerEnumType } from '@nestjs/graphql';

export enum IdCardType {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
}

registerEnumType(IdCardType, {
  name: 'IdCardType',
  description: 'Type of ID card (Student or Staff)',
});

export enum IdCardOrientation {
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE = 'LANDSCAPE',
}

registerEnumType(IdCardOrientation, {
  name: 'IdCardOrientation',
  description: 'Card orientation (Portrait or Landscape)',
});

export enum IdCardSide {
  FRONT = 'FRONT',
  BACK = 'BACK',
  BOTH = 'BOTH',
}

registerEnumType(IdCardSide, {
  name: 'IdCardSide',
  description: 'Card sides to render (Front, Back, or Both)',
});
