"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplate = void 0;
const classic_template_1 = require("./classic.template");
const bold_template_1 = require("./bold.template");
const templates = {
    classic: classic_template_1.classicTemplate,
    bold: bold_template_1.boldTemplate,
};
const getTemplate = (templateKey) => {
    return templates[templateKey] || classic_template_1.classicTemplate;
};
exports.getTemplate = getTemplate;
//# sourceMappingURL=index.js.map