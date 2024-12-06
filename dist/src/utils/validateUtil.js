"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFields = void 0;
const validateFields = (section) => {
    const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";
    const isPositiveInteger = (value) => typeof value === "number" && value >= 0 && Number.isInteger(value);
    if (!isNonEmptyString(section.id) ||
        !isNonEmptyString(section.Course) ||
        !isNonEmptyString(section.Title) ||
        !isNonEmptyString(section.Professor) ||
        !isNonEmptyString(section.Subject)) {
        return false;
    }
    if (!isPositiveInteger(section.Year) ||
        !isPositiveInteger(section.Pass) ||
        !isPositiveInteger(section.Fail) ||
        !isPositiveInteger(section.Audit)) {
        return false;
    }
    return true;
};
exports.validateFields = validateFields;
//# sourceMappingURL=validateUtil.js.map