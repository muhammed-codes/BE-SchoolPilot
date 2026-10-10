import { ObjectType, Field, InputType, Int, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';
import {
  IdCardType,
  IdCardOrientation,
  IdCardSide,
} from '../enums/id-card.enums';
import { IdCardTemplate } from '../entities/id-card-template.entity';

@ObjectType()
export class IdCardRenderResult {
  @Field()
  html!: string;

  @Field(() => String, { nullable: true })
  frontHtml?: string | null;

  @Field(() => String, { nullable: true })
  backHtml?: string | null;

  @Field(() => Int)
  totalCards!: number;

  @Field()
  templateKey!: string;

  @Field()
  templateName!: string;
}

@ObjectType()
export class IdCardPdfResult {
  @Field()
  pdfUrl!: string;

  @Field(() => String, { nullable: true })
  pdfPrivateUrl?: string;

  @Field(() => Int, { nullable: true })
  expiresAt?: number;

  @Field(() => Int)
  totalCards!: number;
}

@InputType()
export class UpdateSchoolIdCardSettingsInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  defaultStudentTemplateId?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  defaultStaffTemplateId?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  showQrCode?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  showSchoolAddress?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  showPrincipalSignature?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  customNote?: string | null;
}

@InputType()
export class RenderStudentIdCardInput {
  @Field()
  @IsUUID()
  studentId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}

@InputType()
export class RenderStaffIdCardInput {
  @Field()
  @IsUUID()
  staffId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}

@InputType()
export class RenderBatchStudentIdCardsInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  studentIds?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}

@InputType()
export class RenderBatchStaffIdCardsInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  staffIds?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}

@InputType()
export class GenerateStudentIdCardPdfInput {
  @Field()
  @IsUUID()
  studentId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}

@InputType()
export class GenerateStaffIdCardPdfInput {
  @Field()
  @IsUUID()
  staffId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}

@InputType()
export class GenerateBatchStudentIdCardsPdfInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  studentIds?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}

@InputType()
export class GenerateBatchStaffIdCardsPdfInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  staffIds?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @Field(() => IdCardSide, { nullable: true })
  @IsOptional()
  @IsEnum(IdCardSide)
  side?: IdCardSide;
}
