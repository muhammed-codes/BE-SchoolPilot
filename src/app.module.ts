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
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const host = config.get<string>('SUPABASE_DB_HOST') || '';
        let resolvedHost = host;
        
        try {
          if (host && !/^[0-9.]+$/.test(host)) {
            const dns = await import('dns');
            const { address } = await dns.promises.lookup(host, { family: 4 });
            resolvedHost = address;
          }
        } catch (err) {
          console.warn(`Failed to resolve IPv4 for ${host}, falling back to original host`, err);
        }

        return {
          type: 'postgres',
          host: resolvedHost,
          port: config.get<number>('SUPABASE_DB_PORT'),
          database: config.get<string>('SUPABASE_DB_NAME'),
          username: config.get<string>('SUPABASE_DB_USER'),
          password: config.get<string>('SUPABASE_DB_PASSWORD'),
          ssl: { rejectUnauthorized: false },
          synchronize: false,
          autoLoadEntities: true,
          migrationsRun: config.get<string>('NODE_ENV') === 'production',
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
        };
      },
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoSchemaFile: 'schema.gql',
        sortSchema: true,
        resolvers: { Upload: require('graphql-upload-ts').GraphQLUpload },
        playground: config.get<string>('NODE_ENV') !== 'production',
        introspection: config.get<string>('NODE_ENV') !== 'production',
        csrfPrevention: true,
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
    TermsModule,
    IdCardsModule,
    MailModule,
    AccessModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
