import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { UserRole } from '../../common/enums';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
