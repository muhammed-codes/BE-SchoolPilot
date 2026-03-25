import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { SchoolsModule } from './schools/schools.module.js';
import { ClassesModule } from './classes/classes.module.js';
import { SubjectsModule } from './subjects/subjects.module.js';
import { StudentsModule } from './students/students.module.js';
import { ResultsModule } from './results/results.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { UploadModule } from './upload/upload.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('SUPABASE_DB_HOST'),
        port: config.get<number>('SUPABASE_DB_PORT'),
        database: config.get<string>('SUPABASE_DB_NAME'),
        username: config.get<string>('SUPABASE_DB_USER'),
        password: config.get<string>('SUPABASE_DB_PASSWORD'),
        ssl: { rejectUnauthorized: false },
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoSchemaFile: 'schema.gql',
        sortSchema: true,
        playground: config.get<string>('NODE_ENV') !== 'production',
        context: ({ req }: { req: Request }) => ({ req }),
      }),
    }),

    AuthModule,
    UsersModule,
    SchoolsModule,
    ClassesModule,
    SubjectsModule,
    StudentsModule,
    ResultsModule,
    AttendanceModule,
    NotificationsModule,
    PdfModule,
    UploadModule,
  ],
})
export class AppModule {}
