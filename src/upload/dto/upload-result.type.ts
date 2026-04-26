import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UploadResult {
  @Field()
  url: string;

  @Field({ nullable: true })
  pdfPrivateUrl?: string;

  @Field({ nullable: true })
  expiresAt?: number;

  @Field()
  publicId: string;
}
