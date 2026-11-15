import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';

@InputType()
export class CreateSchoolInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Please enter a valid phone number',
  })
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true, defaultValue: 'basic' })
  @IsOptional()
  schoolType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^[A-Za-z0-9_-]{2,10}$/, {
    message: 'School code must be 2 to 10 characters',
  })
  schoolCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  defaultReportTemplate?: string;

  @Field({ nullable: true })
  @IsOptional()
  schoolStartTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  resultColor?: string;
}
