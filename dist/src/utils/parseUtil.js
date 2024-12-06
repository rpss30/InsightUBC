"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeParseSection = exports.safeParse = exports.sectionGuard = void 0;
const sectionGuard = (o) => {
    const requiredFields = ["id", "Course", "Title", "Professor", "Subject",
        "Year", "Avg", "Pass", "Fail", "Audit", "Section"];
    if (!(o.result)) {
        return false;
    }
    o.result.forEach((sectionObject) => {
        if (typeof sectionObject !== "object") {
            return false;
        }
        if (sectionObject == null) {
            return false;
        }
        for (const field of requiredFields) {
            if (!(field in sectionObject)) {
                return false;
            }
        }
    });
    return true;
};
exports.sectionGuard = sectionGuard;
const safeParse = (guard) => (jsonText) => {
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    }
    catch (e) {
        return { didProduceError: true };
    }
    return guard(parsed) ? { parsed, didProduceError: false } : { didProduceError: true };
};
exports.safeParse = safeParse;
const safeParseSection = (guard) => (jsonText) => {
    const parsed = JSON.parse(jsonText);
    return guard(parsed) ? { parsed, didProduceError: false } : { didProduceError: true };
};
exports.safeParseSection = safeParseSection;
//# sourceMappingURL=parseUtil.js.map