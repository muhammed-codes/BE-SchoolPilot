import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { UserRole } from '../../common/enums';

@InputType()
export class RegisterInput {
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

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^(?:\+?[1-9]\d{6,14}|0\d{6,14})?$/, {
    message: 'Enter a valid phone number',
  })
  phone?: string;
}
