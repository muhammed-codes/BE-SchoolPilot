"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreComponent = void 0;
const graphql_1 = require("@nestjs/graphql");
var ScoreComponent;
(function (ScoreComponent) {
    ScoreComponent["CA"] = "ca";
    ScoreComponent["CA1"] = "ca1";
    ScoreComponent["CA2"] = "ca2";
    ScoreComponent["MID_TERM"] = "mid_term";
    ScoreComponent["ASSIGNMENT"] = "assignment";
    ScoreComponent["PROJECT"] = "project";
    ScoreComponent["EXAM"] = "exam";
})(ScoreComponent || (exports.ScoreComponent = ScoreComponent = {}));
(0, graphql_1.registerEnumType)(ScoreComponent, { name: 'ScoreComponent' });
//# sourceMappingURL=score-component.enum.js.map