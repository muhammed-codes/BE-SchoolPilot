import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsArray, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class PromoteStudentsInput {
  @Field()
  @IsNotEmpty()
  fromClassId: string;

  @Field({ nullable: true })
  @IsOptional()
  toClassId?: string;

  @Field(() => [String])
  @IsArray()
  studentIds: string[];

  @Field()
  @IsBoolean()
  archiveGraduated: boolean;
}
