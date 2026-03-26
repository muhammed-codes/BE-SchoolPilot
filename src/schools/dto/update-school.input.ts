import { InputType, PartialType } from '@nestjs/graphql';
import { CreateSchoolInput } from './create-school.input';

@InputType()
export class UpdateSchoolInput extends PartialType(CreateSchoolInput) {}
