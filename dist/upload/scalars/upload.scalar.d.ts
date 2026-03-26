import { CustomScalar } from '@nestjs/graphql';
import { ValueNode } from 'graphql';
export declare class UploadScalar implements CustomScalar<unknown, unknown> {
    description: string;
    parseValue(value: unknown): Promise<import("graphql-upload-ts").FileUpload>;
    serialize(value: unknown): never;
    parseLiteral(ast: ValueNode): Promise<import("graphql-upload-ts").FileUpload>;
}
