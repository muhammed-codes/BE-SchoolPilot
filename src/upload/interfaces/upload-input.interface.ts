import { FileUpload, Upload } from 'graphql-upload-ts';

export interface IUploadPromiseContainer {
  promise: Promise<FileUpload>;
}

export interface IWrappedUploadFile {
  file: UploadInput;
}

export type UploadInput =
  | Upload
  | Promise<FileUpload>
  | FileUpload
  | IUploadPromiseContainer
  | IWrappedUploadFile;
