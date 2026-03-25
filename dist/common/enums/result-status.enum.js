"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
var ResultStatus;
(function (ResultStatus) {
    ResultStatus["DRAFT"] = "draft";
    ResultStatus["SCORES_ENTERED"] = "scores_entered";
    ResultStatus["PENDING_ADMIN_REVIEW"] = "pending_admin_review";
    ResultStatus["PENDING_PRINCIPAL_APPROVAL"] = "pending_principal_approval";
    ResultStatus["PUBLISHED"] = "published";
    ResultStatus["RETURNED"] = "returned";
})(ResultStatus || (exports.ResultStatus = ResultStatus = {}));
(0, graphql_1.registerEnumType)(ResultStatus, { name: 'ResultStatus' });
//# sourceMappingURL=result-status.enum.js.map