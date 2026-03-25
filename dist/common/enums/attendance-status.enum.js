"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "present";
    AttendanceStatus["ABSENT"] = "absent";
    AttendanceStatus["LATE"] = "late";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
(0, graphql_1.registerEnumType)(AttendanceStatus, { name: 'AttendanceStatus' });
//# sourceMappingURL=attendance-status.enum.js.map