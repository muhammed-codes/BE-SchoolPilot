"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradingSystem = void 0;
const graphql_1 = require("@nestjs/graphql");
var GradingSystem;
(function (GradingSystem) {
    GradingSystem["WAEC"] = "waec";
    GradingSystem["PERCENTAGE"] = "percentage";
    GradingSystem["LETTER"] = "letter";
    GradingSystem["GPA"] = "gpa";
})(GradingSystem || (exports.GradingSystem = GradingSystem = {}));
(0, graphql_1.registerEnumType)(GradingSystem, { name: 'GradingSystem' });
//# sourceMappingURL=grading-system.enum.js.map