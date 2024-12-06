"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSection = void 0;
const transformSection = (section) => {
    return {
        uuid: String(section.id),
        id: String(section.Course),
        title: String(section.Title),
        instructor: String(section.Professor),
        dept: String(section.Subject),
        year: (section.Section === "overall" ? 1900 : Number(section.Year)),
        avg: Number(section.Avg),
        pass: Number(section.Pass),
        fail: Number(section.Fail),
        audit: Number(section.Audit),
        section: section.Section
    };
};
exports.transformSection = transformSection;
//# sourceMappingURL=transformUtil.js.map