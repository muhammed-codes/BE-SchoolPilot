"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const auth_module_js_1 = require("./auth/auth.module.js");
const users_module_js_1 = require("./users/users.module.js");
const schools_module_js_1 = require("./schools/schools.module.js");
const classes_module_js_1 = require("./classes/classes.module.js");
const subjects_module_js_1 = require("./subjects/subjects.module.js");
const students_module_js_1 = require("./students/students.module.js");
const results_module_js_1 = require("./results/results.module.js");
const attendance_module_js_1 = require("./attendance/attendance.module.js");
const notifications_module_js_1 = require("./notifications/notifications.module.js");
const pdf_module_js_1 = require("./pdf/pdf.module.js");
const upload_module_js_1 = require("./upload/upload.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('SUPABASE_DB_HOST'),
                    port: config.get('SUPABASE_DB_PORT'),
                    database: config.get('SUPABASE_DB_NAME'),
                    username: config.get('SUPABASE_DB_USER'),
                    password: config.get('SUPABASE_DB_PASSWORD'),
                    ssl: { rejectUnauthorized: false },
                    synchronize: false,
                    autoLoadEntities: true,
                }),
            }),
            graphql_1.GraphQLModule.forRootAsync({
                driver: apollo_1.ApolloDriver,
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    autoSchemaFile: 'schema.gql',
                    sortSchema: true,
                    playground: config.get('NODE_ENV') !== 'production',
                    context: ({ req }) => ({ req }),
                }),
            }),
            auth_module_js_1.AuthModule,
            users_module_js_1.UsersModule,
            schools_module_js_1.SchoolsModule,
            classes_module_js_1.ClassesModule,
            subjects_module_js_1.SubjectsModule,
            students_module_js_1.StudentsModule,
            results_module_js_1.ResultsModule,
            attendance_module_js_1.AttendanceModule,
            notifications_module_js_1.NotificationsModule,
            pdf_module_js_1.PdfModule,
            upload_module_js_1.UploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map