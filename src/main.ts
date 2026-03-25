import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
};

bootstrap();
