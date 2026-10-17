import { BadRequestException } from '@nestjs/common';
import * as yup from 'yup';

const userPhoneSchema = yup
  .string()
  .matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, 'Enter a valid phone number')
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
