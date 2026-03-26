"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
var TermStatus;
(function (TermStatus) {
    TermStatus["ACTIVE"] = "active";
    TermStatus["CLOSED"] = "closed";
})(TermStatus || (exports.TermStatus = TermStatus = {}));
(0, graphql_1.registerEnumType)(TermStatus, { name: 'TermStatus' });
//# sourceMappingURL=term-status.enum.js.map