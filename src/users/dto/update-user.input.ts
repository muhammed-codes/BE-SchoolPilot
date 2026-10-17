import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { NamePrefix, UserRole } from '../../common/enums';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  lastName?: string;

  @Field(() => String, { nullable: true })
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

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @Field(() => NamePrefix, { nullable: true })
  @IsOptional()
  @IsEnum(NamePrefix)
  namePrefix?: NamePrefix;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['schoolright', 'classic'])
  adminThemePreference?: string;
}
