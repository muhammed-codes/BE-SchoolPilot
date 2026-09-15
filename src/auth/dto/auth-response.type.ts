import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  mustChangePassword?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  success?: boolean;

  @Field({ nullable: true })
  message?: string;
}
