"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryGuard = void 0;
let globalid = "";
const queryGuard = (o) => {
    const applykeys = [];
    const optionkeys = [];
    const groupkeys = [];
    if (!(o.OPTIONS) || !o.OPTIONS.COLUMNS || o.OPTIONS.COLUMNS.length === 0) {
        return false;
    }
    globalid = o.OPTIONS.COLUMNS[0].split("_")[0];
    if (globalid === "") {
        return false;
    }
    if (!("WHERE" in o)) {
        return false;
    }
    if (Object.keys(o.WHERE).length > 0 && !validFilterSyntax(o.WHERE)) {
        return false;
    }
    if ("TRANSFORMATIONS" in o) {
        const keys = processTransformations(o.TRANSFORMATIONS);
        if (!keys) {
            return false;
        }
        applykeys.push(...keys[0]);
        groupkeys.push(...keys[1]);
    }
    if (!(o.OPTIONS) || !o.OPTIONS.COLUMNS || o.OPTIONS.COLUMNS.length === 0) {
        return false;
    }
    const options = o.OPTIONS;
    const columns = options.COLUMNS;
    for (const key of columns) {
        if (!isValidMkey(key) && !isValidSkey(key) && !applykeys.includes(key)) {
            return false;
        }
        if (groupkeys.length > 0 && !groupkeys.includes(key) && !applykeys.includes(key)) {
            return false;
        }
        optionkeys.push(key);
    }
    if ("ORDER" in options) {
        if (!processSort(options.ORDER, optionkeys)) {
            return false;
        }
    }
    else {
        return true;
    }
    return true;
};
exports.queryGuard = queryGuard;
const logicFilters = ["AND", "OR", "NOT"];
const mComparators = ["LT", "GT", "EQ"];
const validFilterSyntax = (o) => {
    if (Array.isArray(o)) {
        for (const key of o) {
            if (!validFilterSyntax(key)) {
                return false;
            }
        }
    }
    else if (typeof o === "object") {
        if (Object.keys(o).length === 0) {
            return false;
        }
        for (const key in o) {
            if (logicFilters.includes(key)) {
                if (!validFilterSyntax(o[key])) {
                    return false;
                }
            }
            else if (mComparators.includes(key)) {
                if (!validMkeySyntax(o[key])) {
                    return false;
                }
            }
            else if (key === "IS") {
                if (!validSkeySyntax(o[key])) {
                    return false;
                }
            }
            else {
                return false;
            }
        }
    }
    return true;
};
const validSkeySyntax = (o) => {
    const scomparison = o;
    if (Object.keys(scomparison).length > 1) {
        return false;
    }
    const skeyString = Object.keys(scomparison)[0];
    if (!isValidSkey(skeyString)) {
        return false;
    }
    let sstring = scomparison[skeyString];
    if (typeof sstring === "number") {
        return false;
    }
    if (sstring.startsWith("*")) {
        sstring = sstring.slice(1);
    }
    if (sstring.endsWith("*")) {
        sstring = sstring.slice(0, -1);
    }
    if (sstring.includes("*")) {
        return false;
    }
    return true;
};
const validMkeySyntax = (o) => {
    if (o !== Object(o)) {
        return false;
    }
    const mval = o[Object.keys(o)[0]];
    if (typeof mval !== "number") {
        return false;
    }
    if (Object.keys(o).length > 1) {
        return false;
    }
    const mkeyString = Object.keys(o)[0];
    if (!isValidMkey(mkeyString)) {
        return false;
    }
    if (isNaN(Number(mval))) {
        return false;
    }
    return true;
};
function isValidSkey(skey) {
    const [idString, sfield] = skey.split("_");
    if (idString.length === 0 || idString.includes("_") || idString !== globalid) {
        return false;
    }
    const validSfields = [
        "dept",
        "id",
        "instructor",
        "title",
        "uuid",
        "fullname",
        "shortname",
        "number",
        "name",
        "address",
        "type",
        "furniture",
        "href"
    ];
    if (!validSfields.includes(sfield)) {
        return false;
    }
    return true;
}
function isValidMkey(skey) {
    const [idString, sfield] = skey.split("_");
    if (idString.length === 0 || idString.includes("_") || idString !== globalid) {
        return false;
    }
    const validMfields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    if (!validMfields.includes(sfield)) {
        return false;
    }
    return true;
}
function processTransformations(o) {
    const applykeys = [];
    const groupkeys = [];
    if (!("GROUP" in o) || !Array.isArray(o.GROUP)) {
        return false;
    }
    for (const key of o.GROUP) {
        if (!isValidSkey(key) && !isValidMkey(key)) {
            return false;
        }
        groupkeys.push(key);
    }
    if (!("APPLY" in o) || !Array.isArray(o.APPLY)) {
        return false;
    }
    for (const rule of o.APPLY) {
        if (Object.keys(rule).length !== 1) {
            return false;
        }
        const applykeystring = Object.keys(rule)[0];
        const applykey = rule[applykeystring];
        if (applykeys.includes(applykeystring)) {
            return false;
        }
        applykeys.push(applykeystring);
        if (Object.keys(applykey).length > 1 || !isValidApplyToken(Object.keys(applykey)[0])) {
            return false;
        }
        const key = Object.values(applykey)[0];
        if (!(typeof key === "string") || (!isValidMkey(key) && !isValidSkey(key))) {
            return false;
        }
        if (["MAX", "MIN", "AVG", "SUM"].includes(Object.keys(applykey)[0])) {
            if (!["lat", "lon", "seats", "year", "avg", "pass", "fail", "audit"].some((k) => key.includes(k))) {
                return false;
            }
        }
    }
    return [applykeys, groupkeys];
}
function isValidApplyToken(token) {
    const validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    return validTokens.includes(token);
}
function processSort(o, optionkeys) {
    if (typeof o === "string") {
        return isAnyKey(o) && optionkeys.includes(o);
    }
    if (!("dir" in o)) {
        return false;
    }
    const dir = o.dir;
    if (dir !== "UP" && dir !== "DOWN") {
        return false;
    }
    if (!("keys" in o)) {
        return false;
    }
    const keys = o.keys;
    if (!Array.isArray(keys)) {
        return false;
    }
    for (const key of keys) {
        if (typeof key !== "string" || !isAnyKey(key) || !optionkeys.includes(key)) {
            return false;
        }
    }
    return true;
}
function isAnyKey(o) {
    return ((isValidMkey(o) || isValidSkey(o)) || (o.length > 0 && !o.includes("_")));
}
//# sourceMappingURL=queryGuard.js.map