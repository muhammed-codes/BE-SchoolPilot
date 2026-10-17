import { BadRequestException } from '@nestjs/common';
import * as yup from 'yup';

const userPhoneSchema = yup
  .string()
  .matches(/^(?:\d{7,15})?$/, 'Phone number must contain 7 to 15 digits')
  .nullable()
  .optional();

export const validateUserPhone = async (phone: unknown) => {
  try {
    await userPhoneSchema.validate(phone, { strict: true });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
};
