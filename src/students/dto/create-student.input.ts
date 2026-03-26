import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Gender } from '../../common/enums';

@InputType()
export class CreateStudentInput {
  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsNotEmpty()
  admissionNumber: string;

  @Field()
  @IsDateString()
  dateOfBirth: string;

  @Field(() => Gender)
  @IsEnum(Gender)
  gender: Gender;

  @Field()
  @IsNotEmpty()
  classId: string;

  @Field({ nullable: true })
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  stateOfOrigin?: string;

  @Field({ nullable: true })
  @IsOptional()
  parentPhone?: string;
}
