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
  @Matches(/^[A-Za-z0-9]{2,10}$/, {
    message: 'schoolCode must be 2-10 alphanumeric characters',
  })
  schoolCode?: string;
}
