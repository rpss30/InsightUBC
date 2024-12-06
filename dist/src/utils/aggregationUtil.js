"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyRule = exports.groupResults = void 0;
function groupResults(query, results, keys) {
    const groups = {};
    results.forEach((element) => {
        const groupKey = keys.map((key) => element[key]).join("-");
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(element);
    });
    return groups;
}
exports.groupResults = groupResults;
function applyRule(query, groups) {
    return 0;
}
exports.applyRule = applyRule;
//# sourceMappingURL=aggregationUtil.js.map