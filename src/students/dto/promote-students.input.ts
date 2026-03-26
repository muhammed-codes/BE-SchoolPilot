import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsArray, IsBoolean } from 'class-validator';

@InputType()
export class PromoteStudentsInput {
  @Field()
  @IsNotEmpty()
  fromClassId: string;

  @Field()
  @IsNotEmpty()
  toClassId: string;

  @Field(() => [String])
  @IsArray()
  studentIds: string[];

  @Field()
  @IsBoolean()
  archiveGraduated: boolean;
}
