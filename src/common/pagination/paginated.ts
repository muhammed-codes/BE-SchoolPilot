import { Type } from '@nestjs/common';
import { ObjectType, Field, Int } from '@nestjs/graphql';

export const createPaginatedType = <T>(ItemType: Type<T>) => {
  @ObjectType(`Paginated${ItemType.name}`)
  class PaginatedResult {
    @Field(() => [ItemType])
    items: T[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    totalPages: number;
  }

  return PaginatedResult;
};
