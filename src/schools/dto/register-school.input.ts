import { InputType, Field } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * Input for public school self-registration.
 * Creates the school AND the first SCHOOL_ADMIN user in one transaction.
 * This mutation is public (no auth required).
 */
@InputType()
export class RegisterSchoolInput {
  // ── Contact Person Details ──────────────────────────────────────────────────

  @Field(() => String)
  @IsNotEmpty({ message: "Please enter the administrator's first name" })
  adminFirstName: string;

  @Field(() => String)
  @IsNotEmpty({ message: "Please enter the administrator's last name" })
  adminLastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  gender?: string;

  @Field(() => String)
  @IsEmail({}, { message: "Please enter a valid email address" })
  @IsNotEmpty({ message: "Please enter the administrator's email address" })
  adminEmail: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  roleInSchool?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Please enter a valid phone number',
  })
  adminPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Please enter a valid phone number',
  })
  whatsappNumber?: string;

  // ── School Details ──────────────────────────────────────────────────────────

  @Field(() => String)
  @IsNotEmpty({ message: 'School name is required' })
  schoolName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  state?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  schoolCapacity?: string;

  @Field(() => String, { nullable: true, defaultValue: 'basic' })
  @IsOptional()
  schoolType?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^[A-Za-z0-9_-]{2,10}$/, {
    message: 'School code must be 2 to 10 characters',
  })
  schoolCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  schoolAddress?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Please enter a valid phone number',
  })
  schoolPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  schoolEmail?: string;

  // ── Security Credentials ────────────────────────────────────────────────────

  @Field(() => String)
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  adminPassword: string;
}
