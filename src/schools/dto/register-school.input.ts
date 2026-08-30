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
  // ── School Details ──────────────────────────────────────────────────────────

  @Field(() => String)
  @IsNotEmpty({ message: 'School name is required' })
  schoolName: string;

  @Field(() => String, { nullable: true, defaultValue: 'basic' })
  @IsOptional()
  schoolType?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^[A-Za-z0-9_-]{2,10}$/, {
    message: 'School code must be 2–10 alphanumeric characters',
  })
  schoolCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  schoolAddress?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  schoolPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid school email address' })
  schoolEmail?: string;

  // ── First Admin Account ─────────────────────────────────────────────────────

  @Field(() => String)
  @IsNotEmpty({ message: 'Admin first name is required' })
  adminFirstName: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Admin last name is required' })
  adminLastName: string;

  @Field(() => String)
  @IsEmail({}, { message: 'Invalid admin email address' })
  @IsNotEmpty({ message: 'Admin email is required' })
  adminEmail: string;

  @Field(() => String)
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  adminPassword: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  adminPhone?: string;
}
