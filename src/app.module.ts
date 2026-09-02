import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { StudentsModule } from './students/students.module';
import { ResultsModule } from './results/results.module';
import { AttendanceModule } from './attendance/attendance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PdfModule } from './pdf/pdf.module';
import { UploadModule } from './upload/upload.module';
import { TermsModule } from './terms/terms.module';
import { IdCardsModule } from './id-cards/id-cards.module';
import { MailModule } from './mail/mail.module';
import { AccessModule } from './access/access.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ThrottlerModule.forRoot([
    //   {
    //     name: 'default',
    //     ttl: 60000,
    //     limit: 100,
    //   },
    // ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const host =
          config.get<string>('SUPABASE_DB_HOST') ||
          config.get<string>('DB_HOST') ||
          '';
        const endpointId = host.includes('neon.tech')
          ? host.split('.')[0]
          : undefined;

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host,
                port:
                  config.get<number>('SUPABASE_DB_PORT') ||
                  config.get<number>('DB_PORT') ||
                  5432,
                database:
                  config.get<string>('SUPABASE_DB_NAME') ||
                  config.get<string>('DB_NAME'),
                username:
                  config.get<string>('SUPABASE_DB_USER') ||
                  config.get<string>('DB_USER'),
                password:
                  config.get<string>('SUPABASE_DB_PASSWORD') ||
                  config.get<string>('DB_PASSWORD'),
              }),
          extra: {
            ...(endpointId ? { options: `endpoint=${endpointId}` } : {}),
            connectionTimeoutMillis: 15000,
            idleTimeoutMillis: 30000,
            max: 25,
          },
          ssl: { rejectUnauthorized: false },
          synchronize: false,
          autoLoadEntities: true,
          migrationsRun: true,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
        };
      },
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: process.env.VERCEL ? true : 'schema.gql',
      sortSchema: true,
      resolvers: { Upload: require('graphql-upload-ts').GraphQLUpload },
      playground: true,
      introspection: true,
      csrfPrevention: true,
      context: ({ req }: { req: Request }) => ({ req }),
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
    TermsModule,
    IdCardsModule,
    MailModule,
    AccessModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: GqlThrottlerGuard,
    // },
  ],
})
export class AppModule {}
