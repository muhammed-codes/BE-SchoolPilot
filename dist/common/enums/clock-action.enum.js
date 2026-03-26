"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClockAction = void 0;
const graphql_1 = require("@nestjs/graphql");
var ClockAction;
(function (ClockAction) {
    ClockAction["CLOCK_IN"] = "clock_in";
    ClockAction["CLOCK_OUT"] = "clock_out";
})(ClockAction || (exports.ClockAction = ClockAction = {}));
(0, graphql_1.registerEnumType)(ClockAction, { name: 'ClockAction' });
//# sourceMappingURL=clock-action.enum.js.map