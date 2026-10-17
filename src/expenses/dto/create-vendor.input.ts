import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  Matches,
} from 'class-validator';

@InputType()
export class CreateExpenseVendorInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Enter a valid phone number',
  })
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateExpenseVendorInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Enter a valid phone number',
  })
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}
