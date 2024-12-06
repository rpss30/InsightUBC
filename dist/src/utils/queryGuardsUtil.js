"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuery = exports.isEQ = exports.isLT = exports.isGT = exports.isIS = exports.isNOT = exports.isOR = exports.isAND = exports.isOPTIONS = void 0;
function isOPTIONS(obj) {
    return obj && Array.isArray(obj.COLUMNS) && obj.COLUMNS.every((column) => typeof column === "string") && (typeof obj.ORDER === "undefined" || typeof obj.ORDER === "string");
}
exports.isOPTIONS = isOPTIONS;
function isAND(obj) {
    return obj && Array.isArray(obj.AND) && obj.AND.every(isQueryComponent);
}
exports.isAND = isAND;
function isOR(obj) {
    return obj && Array.isArray(obj.OR) && obj.OR.every(isQueryComponent);
}
exports.isOR = isOR;
function isNOT(obj) {
    return obj && isQueryComponent(obj.NOT);
}
exports.isNOT = isNOT;
function isIS(obj) {
    return obj && typeof obj === "object" && typeof Object.values(obj)[0] === "string";
}
exports.isIS = isIS;
function isGT(obj) {
    return obj && typeof obj === "object" && typeof Object.values(obj)[0] === "number";
}
exports.isGT = isGT;
function isLT(obj) {
    return obj && typeof obj === "object" && typeof Object.values(obj)[0] === "number";
}
exports.isLT = isLT;
function isEQ(obj) {
    return obj && typeof obj === "object" && typeof Object.values(obj)[0] === "number";
}
exports.isEQ = isEQ;
function isQuery(obj) {
    return obj && isQueryComponent(obj.WHERE) && isOPTIONS(obj.OPTIONS);
}
exports.isQuery = isQuery;
function isQueryComponent(obj) {
    return obj && (isAND(obj) || isOR(obj) || isNOT(obj) || isLT(obj) || isGT(obj) || isEQ(obj) || isIS(obj));
}
//# sourceMappingURL=queryGuardsUtil.js.map