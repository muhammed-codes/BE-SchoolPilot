import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSONObject } from '../../common/scalars/json-object.scalar';
import { ResultTemplateConfig } from '../templates/result-template-config.interface';

@InputType()
export class CreateResultTemplateInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  templateName?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isDefault?: boolean;

  @Field(() => [String], { nullable: true, defaultValue: [] })
  assignedClassIds?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  config?: ResultTemplateConfig;
}

@InputType()
export class UpdateResultTemplateInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Boolean, { nullable: true })
  isDefault?: boolean;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field(() => [String], { nullable: true })
  assignedClassIds?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  config?: ResultTemplateConfig;
}

@InputType()
export class AssignTemplateToClassesInput {
  @Field()
  templateId!: string;

  @Field(() => [String])
  classIds!: string[];

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  setAsSchoolDefault?: boolean;
}
