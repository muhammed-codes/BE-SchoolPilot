import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FeeClassLookup {
  @Field() id!: string;
  @Field() name!: string;
}

/** Deliberately excludes birth date, address, guardian and health information. */
@ObjectType()
export class FeeStudentLookup {
  @Field() id!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field() fullName!: string;
  @Field() admissionNumber!: string;
  @Field() currentClassId!: string;
  @Field(() => FeeClassLookup, { nullable: true })
  currentClass?: FeeClassLookup;
}
