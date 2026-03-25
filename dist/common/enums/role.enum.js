"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const graphql_1 = require("@nestjs/graphql");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["SCHOOL_ADMIN"] = "school_admin";
    UserRole["PRINCIPAL"] = "principal";
    UserRole["CLASS_TEACHER"] = "class_teacher";
    UserRole["SUBJECT_TEACHER"] = "subject_teacher";
    UserRole["PARENT"] = "parent";
})(UserRole || (exports.UserRole = UserRole = {}));
(0, graphql_1.registerEnumType)(UserRole, { name: 'UserRole' });
//# sourceMappingURL=role.enum.js.map