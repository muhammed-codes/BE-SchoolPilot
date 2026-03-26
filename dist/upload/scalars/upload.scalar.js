"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadScalar = void 0;
const graphql_1 = require("@nestjs/graphql");
const graphql_upload_ts_1 = require("graphql-upload-ts");
let UploadScalar = class UploadScalar {
    description = 'File upload scalar type';
    parseValue(value) {
        return graphql_upload_ts_1.GraphQLUpload.parseValue(value);
    }
    serialize(value) {
        return graphql_upload_ts_1.GraphQLUpload.serialize(value);
    }
    parseLiteral(ast) {
        return graphql_upload_ts_1.GraphQLUpload.parseLiteral(ast, {});
    }
};
exports.UploadScalar = UploadScalar;
exports.UploadScalar = UploadScalar = __decorate([
    (0, graphql_1.Scalar)('Upload')
], UploadScalar);
//# sourceMappingURL=upload.scalar.js.map