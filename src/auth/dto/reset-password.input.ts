import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
