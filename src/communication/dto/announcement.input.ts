import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AnnouncementAudience } from '../entities/announcement.entity';

@InputType()
export class CreateAnnouncementInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  body!: string;

  @Field(() => AnnouncementAudience)
  @IsEnum(AnnouncementAudience)
  audience!: AnnouncementAudience;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  targetClassId?: string;
}

@InputType()
export class UpdateAnnouncementInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;

  @Field(() => AnnouncementAudience, { nullable: true })
  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  targetClassId?: string;
}
