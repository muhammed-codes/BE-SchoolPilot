import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

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
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true, defaultValue: 'basic' })
  @IsOptional()
  schoolType?: string;
}
