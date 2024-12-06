"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getID = exports.applyTransformations = exports.applyOPTIONS = exports.applyColumns = exports.applyFilters = exports.prefixID = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
function prefixID(results, id) {
    results.forEach((result) => {
        for (const key of Object.keys(result)) {
            result[id + "_" + key] = result[key];
            delete result[key];
        }
    });
}
exports.prefixID = prefixID;
function applyFilters(filter, dataset) {
    if (!filter || Object.keys(filter).length === 0) {
        return dataset;
    }
    return dataset.filter((item) => evaluateFilter(filter, item));
}
exports.applyFilters = applyFilters;
function evaluateFilter(filter, item) {
    const [type, condition] = Object.entries(filter)[0];
    switch (type) {
        case "AND":
            return condition.every((subFilter) => evaluateFilter(subFilter, item));
        case "OR":
            return condition.some((subFilter) => evaluateFilter(subFilter, item));
        case "NOT":
            return !evaluateFilter(condition, item);
        case "LT":
        case "GT":
        case "EQ":
            return compareMComparator(type, condition, item);
        case "IS":
            return compareSComparator(condition, item);
        default:
            return true;
    }
}
function compareMComparator(type, condition, item) {
    const [key, value] = Object.entries(condition)[0];
    switch (type) {
        case "LT":
            return item[key] < value;
        case "GT":
            return item[key] > value;
        case "EQ":
            return item[key] === value;
        default:
            return false;
    }
}
function compareSComparator(condition, item) {
    const [key, valueRegex] = Object.entries(condition)[0];
    const regex = new RegExp(`^${valueRegex.replace(/\*/g, ".*")}$`);
    return regex.test(item[key]);
}
function applyColumns(columns, dataset) {
    return dataset.map((item) => {
        const projectedItem = {};
        columns.forEach((column) => {
            if (column in item) {
                projectedItem[column] = item[column];
            }
        });
        return projectedItem;
    });
}
exports.applyColumns = applyColumns;
function applyOPTIONS(query, results) {
    let sortedResults = [...results];
    if (query.OPTIONS?.ORDER) {
        if (typeof query.OPTIONS.ORDER === "string") {
            sortedResults = results.sort((a, b) => {
                const valueA = a[query.OPTIONS.ORDER];
                const valueB = b[query.OPTIONS.ORDER];
                if (typeof valueA === "number" && typeof valueB === "number") {
                    return valueA - valueB;
                }
                else {
                    return String(valueA).localeCompare(String(valueB));
                }
            });
        }
        else {
            sortedResults = results.sort((a, b) => {
                let sort = query.OPTIONS.ORDER;
                for (const key of sort.keys) {
                    if (a[key] !== b[key]) {
                        if (sort.dir === "UP") {
                            return a[key] < b[key] ? -1 : 1;
                        }
                        else {
                            return a[key] < b[key] ? 1 : -1;
                        }
                    }
                }
                return 0;
            });
        }
    }
    return sortedResults;
}
exports.applyOPTIONS = applyOPTIONS;
function applyTransformations(transformations, dataset) {
    let groupedData = applyGrouping(transformations.GROUP, dataset);
    return applyApplyRules(transformations.APPLY, groupedData);
}
exports.applyTransformations = applyTransformations;
function applyGrouping(groupKeys, dataset) {
    const groups = {};
    dataset.forEach((item) => {
        const groupKey = groupKeys.map((key) => item[key]).join("|");
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
    });
    return Object.values(groups);
}
function applyApplyRules(applyRules, groups) {
    return groups.map((group) => {
        const result = {};
        for (const rule of applyRules) {
            const [applyKey, operation] = Object.entries(rule)[0];
            const [opType, field] = Object.entries(operation)[0];
            switch (opType) {
                case "MAX":
                    result[applyKey] = group.reduce((maxSoFar, item) => {
                        const currValue = validateField(item, field);
                        return currValue > maxSoFar ? currValue : maxSoFar;
                    }, Number.NEGATIVE_INFINITY);
                    break;
                case "MIN":
                    result[applyKey] = group.reduce((maxSoFar, item) => {
                        const currValue = validateField(item, field);
                        return currValue < maxSoFar ? currValue : maxSoFar;
                    }, Number.POSITIVE_INFINITY);
                    break;
                case "AVG":
                    result[applyKey] = parseFloat((group.reduce((acc, item) => new decimal_js_1.default(validateField(item, field)).add(acc).toNumber(), 0) /
                        group.length).toFixed(2));
                    break;
                case "SUM":
                    result[applyKey] = parseFloat(group.reduce((acc, item) => acc + validateField(item, field), 0).toFixed(2));
                    break;
                case "COUNT": {
                    const uniqueValues = new Set(group.map((item) => item[field]));
                    result[applyKey] = uniqueValues.size;
                    break;
                }
                default:
                    throw new Error(`Unsupported operation: ${opType}`);
            }
        }
        return { ...group.reduce((acc, cur) => ({ ...acc, ...cur }), {}), ...result };
    });
}
function getID(filter) {
    const [type, condition] = Object.entries(filter)[0];
    let id = "";
    switch (type) {
        case "AND":
        case "OR":
            id = getID(condition[0]);
            break;
        case "NOT":
            id = getID(condition);
            break;
        case "LT":
        case "GT":
        case "EQ":
        case "IS":
            id = extractID(type, condition);
    }
    return id;
}
exports.getID = getID;
function extractID(type, condition) {
    const [key, value] = Object.entries(condition)[0];
    let index = key.indexOf("_");
    return key.substring(0, index);
}
function validateField(item, field) {
    const fieldValue = item[field];
    if (typeof fieldValue !== "number" || isNaN(fieldValue)) {
        throw new Error(`Field ${field} must be numeric.`);
    }
    return fieldValue;
}
//# sourceMappingURL=performQueryHelpers.js.map