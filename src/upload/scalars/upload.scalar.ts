import { Scalar, CustomScalar } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload-ts';
import { ValueNode } from 'graphql';

@Scalar('Upload')
export class UploadScalar implements CustomScalar<unknown, unknown> {
  description = 'File upload scalar type';

  parseValue(value: unknown) {
    return GraphQLUpload.parseValue(value);
  }

  serialize(value: unknown) {
    return GraphQLUpload.serialize(value);
  }

  parseLiteral(ast: ValueNode) {
    return GraphQLUpload.parseLiteral(ast, {});
  }
}
