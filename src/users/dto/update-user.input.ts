import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { NamePrefix, UserRole } from '../../common/enums';

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

  @Field(() => NamePrefix, { nullable: true })
  @IsOptional()
  @IsEnum(NamePrefix)
  namePrefix?: NamePrefix;
}
