import {
	IS,
	FILTER,
	MCOMPARATOR,
	SORT,
	TRANSFORMATIONS,
	Key,
	APPLYRULE, Query, SORTList,
} from "../model/Query";
import {InsightResult} from "../controller/IInsightFacade";
import {Section} from "../model/Section";
import {BuildingRoom} from "../model/BuildingRoom";
import Decimal from "decimal.js";

// Prefixes the key with the section id for each section
export function prefixID(results: InsightResult[], id: string) {
	results.forEach((result: InsightResult) => {
		for (const key of Object.keys(result)) {
			result[id + "_" + key] = result[key];
			delete result[key];
		}
	});
}

/*
* The following functions were written with some assistance from AI tools such as ChatGPT.
* They were not auto-generated, but AI tools were consulted for certain problems.
*/

export function applyFilters(filter: FILTER, dataset: Array<Section | BuildingRoom>) {
	if (!filter || Object.keys(filter).length === 0) {
		return dataset;
	} // No filtering if WHERE is empty

	return dataset.filter((item: Section | BuildingRoom) => evaluateFilter(filter, item));
}

function evaluateFilter(filter: FILTER, item: Section | BuildingRoom): boolean {
	const [type, condition] = Object.entries(filter)[0];
	switch (type) {
		case "AND":
			return condition.every((subFilter: FILTER) => evaluateFilter(subFilter, item));
		case "OR":
			return condition.some((subFilter: FILTER) => evaluateFilter(subFilter, item));
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

function compareMComparator(type: "LT" | "GT" | "EQ", condition: MCOMPARATOR, item: Section | BuildingRoom): boolean {
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

function compareSComparator(condition: IS, item: Section | BuildingRoom): boolean {
	const [key, valueRegex] = Object.entries(condition)[0];
	const regex = new RegExp(`^${valueRegex.replace(/\*/g, ".*")}$`);
	return regex.test(item[key] as string);
}

// Columns

export function applyColumns(columns: string[], dataset: InsightResult[]) {
	return dataset.map((item) => {
		const projectedItem: {[k: string]: string | number} = {};
		columns.forEach((column) => {
			if (column in item) {
				projectedItem[column] = item[column];
			}
		});
		return projectedItem;
	});
}

// Sorting
export function applyOPTIONS(query: Query, results: InsightResult[]){
	let sortedResults = [...results];
	if (query.OPTIONS?.ORDER) {
		if (typeof query.OPTIONS.ORDER === "string") {
			sortedResults = results.sort((a, b) => {
				const valueA = a[query.OPTIONS.ORDER as keyof typeof a];
				const valueB = b[query.OPTIONS.ORDER as keyof typeof b];
				if (typeof valueA === "number" && typeof valueB === "number") {
					return valueA - valueB; // Sort numbers
				} else {
					return String(valueA).localeCompare(String(valueB)); // Sort strings
				}
			});
		} else {
			sortedResults = results.sort((a, b) => {
				let sort = query.OPTIONS.ORDER as SORTList;
				for (const key of sort.keys) {
					if (a[key] !== b[key]) {
						if (sort.dir === "UP") {
							return a[key] < b[key] ? -1 : 1;
						} else {
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

// Aggregration

export function applyTransformations(transformations: TRANSFORMATIONS, dataset: InsightResult[]) {
	let groupedData = applyGrouping(transformations.GROUP, dataset);
	return applyApplyRules(transformations.APPLY, groupedData);
}

function applyGrouping(groupKeys: Key[], dataset: InsightResult[]) {
	const groups: {[key: string]: InsightResult[]} = {};

	dataset.forEach((item) => {
		// Create a composite key based on the grouping keys' values for each item
		const groupKey: string = groupKeys.map((key) => item[key]).join("|");

		// Initialize the group if it doesn't exist
		if (!groups[groupKey]) {
			groups[groupKey] = [];
		}

		// Append the item to the correct group
		groups[groupKey].push(item);
	});

	// Optionally, convert groups object to array if needed for further processing
	return Object.values(groups);
}

function applyApplyRules(applyRules: APPLYRULE[], groups: InsightResult[][]) {
	return groups.map((group) => {
		const result: {[key: string]: number} = {};

		for (const rule of applyRules) {
			// Each rule is an object where key is the applykey and value describes the operation
			const [applyKey, operation] = Object.entries(rule)[0];
			const [opType, field] = Object.entries(operation)[0];

			// Depending on the operation type, perform the calculation on the group
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
					result[applyKey] = parseFloat(
						(
							group.reduce(
								(acc, item) =>
									new Decimal(validateField(item, field)).add(acc).toNumber(), 0) /
							group.length
						).toFixed(2)
					);
					break;
				case "SUM":
					result[applyKey] = parseFloat(group.reduce(
						(acc, item) =>
							acc + validateField(item, field), 0).toFixed(2));
					break;
				case "COUNT": {
					// Count unique occurrences
					const uniqueValues = new Set(group.map((item) => item[field]));
					result[applyKey] = uniqueValues.size;
					break;
				}
				default:
					throw new Error(`Unsupported operation: ${opType}`);
			}
		}

		// Combine the original group key/values with the result of apply operations
		return {...group.reduce((acc, cur) => ({...acc, ...cur}), {}), ...result};
	});
}

export function getID(filter: FILTER): string {
	const [type, condition] = Object.entries(filter)[0];
	let id = "";
	switch (type) {
		case "AND":
			// return condition.every((subFilter: FILTER) => evaluateFilter(subFilter, item));
		case "OR":
			// return condition.some((subFilter: FILTER) => evaluateFilter(subFilter, item));
			id = getID(condition[0]);
			break;
		case "NOT":
			// return !evaluateFilter(condition, item);
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

function extractID(type: "LT" | "GT" | "EQ" | "IS", condition: MCOMPARATOR): string {
	const [key, value] = Object.entries(condition)[0];
	let index = key.indexOf("_");
	return key.substring(0, index);
}

function validateField(item: InsightResult, field: string) {
	const fieldValue = item[field];
	if (typeof fieldValue !== "number" || isNaN(fieldValue)) {
		throw new Error(`Field ${field} must be numeric.`);
	}
	return fieldValue;
}
