import {Query} from "../model/Query";

let globalid: string = "";

export const queryGuard = (o: any): o is Query => {
	const applykeys: string[] = [];
	const optionkeys: string[] = [];
	const groupkeys: string[] = [];

	if (!(o.OPTIONS) || !o.OPTIONS.COLUMNS || o.OPTIONS.COLUMNS.length === 0) {
		return false;
	}

	globalid = o.OPTIONS.COLUMNS[0].split("_")[0];

	if (globalid === "") {
		return false;
	}

	// Verify WHERE exists
	if (!("WHERE" in o)) {
		return false;
	}

	if (Object.keys(o.WHERE).length > 0 && !validFilterSyntax(o.WHERE)) {
		return false;
	}

	// Process transformations

	if ("TRANSFORMATIONS" in o) {
		const keys = processTransformations(o.TRANSFORMATIONS);

		if (!keys) {
			return false;
		}

		applykeys.push(...keys[0]);
		groupkeys.push(...keys[1]);
	}

	// Process Options

	if (!(o.OPTIONS) || !o.OPTIONS.COLUMNS || o.OPTIONS.COLUMNS.length === 0) {
		return false;
	}

	const options = o.OPTIONS;
	const columns = options.COLUMNS;

	// Validate each column key
	for (const key of columns) {
		if (!isValidMkey(key) && !isValidSkey(key) && !applykeys.includes(key)) {
			return false;
		}

		if (groupkeys.length > 0 && !groupkeys.includes(key) && !applykeys.includes(key)) {
			return false;
		}

		optionkeys.push(key);
	}

	// Check for SORT
	if ("ORDER" in options) {
		if (!processSort(options.ORDER, optionkeys)) {
			return false;
		}
	} else {
		return true;
	}

	return true;
};

const logicFilters = ["AND", "OR", "NOT"];
const mComparators = ["LT", "GT", "EQ"];

const validFilterSyntax = (o: any): boolean => {
	// if (Object.keys(o).length === 0) {
	// 	return true;
	// }

	if (Array.isArray(o)) {
		for (const key of o) {
			if (!validFilterSyntax(key)) {
				return false;
			}
		}
	} else if (typeof o === "object") {
		if (Object.keys(o).length === 0) {
			return false;
		}
		for (const key in o) {
			// Every key must either be a valid logic comparator, a valid mcomparator, an mkey, or an skey
			if (logicFilters.includes(key)) {
				if (!validFilterSyntax(o[key])) {
					return false;
				}
			} else if (mComparators.includes(key)) {
				if (!validMkeySyntax(o[key])) {
					return false;
				}
			} else if (key === "IS") {
				if (!validSkeySyntax(o[key])) {
					return false;
				}
			} else {
				return false;
			}
		}
	}
	return true;
};


const validSkeySyntax = (o: any): boolean => {
	const scomparison = o;

	// There should be only one key
	if (Object.keys(scomparison).length > 1) {
		return false;
	}

	// Confirm that it is a valid skey
	const skeyString = Object.keys(scomparison)[0];
	if (!isValidSkey(skeyString)) {
		return false;
	}

	// Confirm that it is a valid string
	let sstring = scomparison[skeyString];

	if (typeof sstring === "number") {
		return false;
	}

	// Trim single leading asterisk
	if (sstring.startsWith("*")) {
		sstring = sstring.slice(1);
	}

	// Trim single trailing asterisk
	if (sstring.endsWith("*")) {
		sstring = sstring.slice(0, -1);
	}

	// String must not include asterisks
	if (sstring.includes("*")) {
		return false;
	}

	return true;
};

const validMkeySyntax = (o: any): boolean => {
	if (o !== Object(o)) {
		return false;
	}

	const mval = o[Object.keys(o)[0]];

	if (typeof mval !== "number") {
		return false;
	}

	// There should only be one key
	if (Object.keys(o).length > 1) {
		return false;
	}

	// Confirm that it is a valid mkey
	const mkeyString = Object.keys(o)[0];
	if (!isValidMkey(mkeyString)) {
		return false;
	}

	if (isNaN(Number(mval))) {
		return false;
	}

	return true;
};

// HELPER FUNCTIONS


// Created with the assistance of ChatGPT
function isValidSkey(skey: string): boolean {
	// Split the idStringSfield into idstring and sfield
	const [idString, sfield] = skey.split("_");

	// Check if idstring is not empty and does not contain underscore
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

function isValidMkey(skey: string): boolean {
	// Split the idStringSfield into idstring and sfield
	const [idString, sfield] = skey.split("_");

	// Check if idstring is not empty and does not contain underscore
	if (idString.length === 0 || idString.includes("_") || idString !== globalid) {
		return false;
	}

	// Check if sfield is one of dept, id, instructor, title, or uuid
	const validMfields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	if (!validMfields.includes(sfield)) {
		return false;
	}
	return true;
}

function processTransformations(o: object): string[][] | false {
	const applykeys: string[] = [];
	const groupkeys: string[] = [];
	// Process o.GROUP
	if (!("GROUP" in o) || !Array.isArray(o.GROUP)) {
		return false;
	}

	for (const key of o.GROUP) {
		if (!isValidSkey(key) && !isValidMkey(key)) {
			return false;
		}

		groupkeys.push(key);
	}

	// Process o.APPLY
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

		// Check is numeric for MAX/MIN/AVG/SUM
		if (["MAX", "MIN", "AVG", "SUM"].includes(Object.keys(applykey)[0])) {
			if (!["lat", "lon", "seats", "year", "avg", "pass", "fail", "audit"].some((k) => key.includes(k))) {
				return false;
			}
		}
	}

	return [applykeys, groupkeys];
}

function isValidApplyToken(token: string): boolean {
	const validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
	return validTokens.includes(token);
}

function processSort(o: any, optionkeys: string[]) {
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

function isAnyKey(o: string) {
	return ((isValidMkey(o) || isValidSkey(o)) || (o.length > 0 && !o.includes("_")));
}
