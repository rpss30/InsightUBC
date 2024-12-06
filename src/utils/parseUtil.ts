import {FileSection, Section} from "../model/Section";

export interface SectionArray {
	result: FileSection[];
}
export const sectionGuard = (o: any): o is SectionArray => {
	// Helper functions


	// Check fields
	// const requiredFields = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
	const requiredFields = ["id", "Course", "Title", "Professor", "Subject",
		"Year", "Avg", "Pass", "Fail", "Audit", "Section"];

	if (!(o.result)) {
		return false;
	}

	o.result.forEach((sectionObject: unknown) => {
		if (typeof sectionObject !== "object") {
			return false;
		}

		if (sectionObject == null) {
			return false;
		}

		for (const field of requiredFields) {
			if (!(field in sectionObject)) {
				return false; // This ensures we fail fast
			}
		}
	});


	return true;
};

/*
 * The below code is heavily inspired by member ford04 on stack overflow, Type-Safe JSON.Parse.
 * All appropriate attribution goes to them.
*/

export const safeParse = <T>(guard: (o: any) => o is T) => (jsonText: string): ParseResult<T> => {
	let parsed;
	try {
		parsed = JSON.parse(jsonText);
	} catch (e) {
		return {didProduceError: true};
	}
	return guard(parsed) ? {parsed, didProduceError: false} : {didProduceError: true};
};

export const safeParseSection = (guard: (o: any) => o is SectionArray) => (jsonText: string):
	| {parsed: SectionArray; didProduceError: false; error?: undefined}
	| {parsed?: undefined; didProduceError: true; error?: unknown} => {
	const parsed = JSON.parse(jsonText);
	return guard(parsed) ? {parsed, didProduceError: false} : {didProduceError: true};
};

export type ParseResult<T> =
	| {parsed: T; didProduceError: false; error?: undefined}
	| {parsed?: undefined; didProduceError: true; error?: unknown}
