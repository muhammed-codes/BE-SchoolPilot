"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_js_1 = require("./app.module.js");
const graphql_upload_ts_1 = require("graphql-upload-ts");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.enableCors();
    app.setGlobalPrefix('api');
    app.use((0, graphql_upload_ts_1.graphqlUploadExpress)({ maxFileSize: 10_000_000, maxFiles: 10 }));
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
};
bootstrap();
//# sourceMappingURL=main.js.map