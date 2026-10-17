import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { NamePrefix, UserRole } from '../../common/enums';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Enter a valid phone number',
  })
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  schoolId?: string;

  @Field(() => NamePrefix, { nullable: true })
  @IsOptional()
  @IsEnum(NamePrefix)
  namePrefix?: NamePrefix;
}
