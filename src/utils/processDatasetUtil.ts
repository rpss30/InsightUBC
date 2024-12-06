import JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {FileSection, Section} from "../model/Section";
import {ParseResult, safeParse, SectionArray, sectionGuard} from "./parseUtil";
import {transformSection} from "./transformUtil";
import fs from "fs";
import {parse} from "parse5";
import {ChildNode, Document, Element} from "parse5/dist/tree-adapters/default";
import {
	BuildingRoom,
	HTMLParseError,
	isComment,
	isDocument,
	isElement,
	isText,
	requiredBuildingClasses
} from "../model/BuildingRoom";
import {processBuildingTable} from "./processBuildingTableUtil";
import {validateAndReturnRooms} from "./processRoomTableUtil";


export async function processSection(zip: JSZip, id: string, kind: InsightDatasetKind.Sections) {
	// Deal with each file
	const filePromises: Array<Promise<string>> = [];

	zip.folder("courses")?.forEach((relativeDirectory, file) => {
		filePromises.push(file.async("string"));
	});

	if (filePromises.length === 0) {
		return Promise.reject(new InsightError("No courses in zip."));
	}

	const sectionDataAsString: string[] = await Promise.all(filePromises);
	const sectionDataAsSection: Section[] = [];

	// Remove the sometimes empty first entry
	if (sectionDataAsString[0] === "") {
		sectionDataAsString.shift();
	}

	// Parse the JSON data and traverse the course files
	for (const sectionString of sectionDataAsString) {
		// If the course is empty, skip it
		if (sectionString.length === 0) {
			continue;
		}

		// Parse the course file
		const parsed: ParseResult<SectionArray> = safeParse(sectionGuard)(sectionString);

		// The course file is malformed, skip the course
		if (parsed.didProduceError) {
			continue;
		}

		const sectionDataAsFileSection: FileSection[] =
			("result" in parsed.parsed ? parsed.parsed.result : [parsed.parsed]);

		// Keep only valid sections
		// const validatedSections: FileSection[] = sectionDataAsFileSection.filter(validateFields);

		sectionDataAsSection.push(...sectionDataAsFileSection.map(transformSection));
	}

	// If no valid sections exist, the dataset is invalid
	if (sectionDataAsSection.length === 0) {
		return Promise.reject(new InsightError("No valid sections."));
	}

	// Write dataset to disk
	fs.mkdir(__dirname + "/../../data", {recursive: true}, (err) => {
		if (err) {
			return Promise.reject(new InsightError(err.message));
		}
	});
	fs.writeFileSync(__dirname + "/../../data/" + id, JSON.stringify(sectionDataAsSection), {flag: "w"});

	// Update manifest
	fs.writeFileSync(__dirname + "/../../data/_manifest", `${id}_${kind}_${sectionDataAsSection.length}\n`
		, {flag: "a"});

	return Promise.resolve(fs.readdirSync(__dirname + "/../../data/").filter((t: string) => !t.includes("_")));
}

export async function processRoom(zip: JSZip, id: string, kind: InsightDatasetKind.Rooms) {
	// Get index.htm into a variable
	let indexFile: string | undefined;
	try {
		indexFile = await zip.file("index.htm")?.async("text");
		if (indexFile === undefined) {
			return Promise.reject(new InsightError("index.htm not found."));
		}
	} catch (e: unknown) {
		return Promise.reject(new InsightError("An error occurred reading index.html: "));
	}

	const index: Document = parse(indexFile);

	// Process the DOM to find the table containing Room information and return that table
	const buildingTable: Element | null = findOuterElementByInnerTagAndClass(index,
		"td",
		requiredBuildingClasses,
		"table");

	if (buildingTable === null) {
		return Promise.reject("No building table found.");
	}

	const buildings = await processBuildingTable(buildingTable);

	if (buildings instanceof HTMLParseError) {
		return Promise.reject(new InsightError("Problem parsing html: " + buildings));
	}

	const roomsTable: BuildingRoom[] = [];

	for await (const building of buildings) {
		const file = await zip.file(building.uri.replace("./", ""))?.async("text");

		if (!file) {
			continue;
		}

		// A building may contain no rooms table or may contain a table with no valid rooms, in which case that building has no rooms.
		roomsTable.push(...validateAndReturnRooms(building, file));
	}

	if (roomsTable.length === 0) {
		return Promise.reject("This dataset doesn't contain any rooms.");
	}

	// Write dataset to disk
	fs.mkdir(__dirname + "/../../data", {recursive: true}, (err) => {
		if (err) {
			return Promise.reject(new InsightError(err.message));
		}
	});
	fs.writeFileSync(__dirname + "/../../data/" + id, JSON.stringify(roomsTable), {flag: "w"});

	// Update manifest
	fs.writeFileSync(__dirname + "/../../data/_manifest", `${id}_${kind}_${roomsTable.length}\n`
		, {flag: "a"});

	return Promise.resolve(fs.readdirSync(__dirname + "/../../data/").filter((t: string) => !t.includes("_")));
}

export const findOuterElementByInnerTagAndClass = (node: ChildNode | Document,
	tagID: string,
	innerClassNames: string[],
	outerClassTagID: string | null): Element | null => {

	// If the node is a document, we need to iterate over its childnodes
	if (isDocument(node)) {
		for (const childNode of node.childNodes) {
			const result = findOuterElementByInnerTagAndClass(childNode, tagID, innerClassNames, outerClassTagID);
			if (result !== null) {
				return result;
			}
		}
		return null;
	}

	// Each node has to have a tag name in order for us to process it
	if (!("tagName" in node)) {
		return null;
	}

	// If the node is a CommentNode or TextNode we are not interested in it
	if (isComment(node) || isText(node)) {
		return null;
	}

	if (node.nodeName === "head") {
		return null;
	}

	// We iterate over all child nodes to see if they are the INNER node we are looking for
	for (const childNode of node.childNodes) {
		// We only look at Element or Document nodes with the correct tagID
		if (isElement(childNode) && childNode.tagName === tagID) {
			// Loop over every attribute the childNode until we find a valid class and determine if it is correct
			for (const attr of childNode.attrs) {
				if (attr.name === "class" && innerClassNames.some((className) => attr.value.includes(className))) {
					// If the class is correct, we have found the INNER node, return it
					return childNode;
				}
			}
		}

		// If we haven't found the INNER node, look at all the current node's children (DFS)
		const result = findOuterElementByInnerTagAndClass(childNode, tagID, innerClassNames, outerClassTagID);


		// If we have found the INNER node down the stack and the current node is of the correct type, return it
		// Otherwise, keep moving up the dom and returning the inner node up the call stack
		if (result !== null &&
			result.tagName === tagID &&
			(node.tagName === outerClassTagID || outerClassTagID === null)) {
			return node;
		} else if (result !== null) {
			return result;
		}
	}
	return null;
};

const validateFields = (section: FileSection): boolean => {
	const isNonEmptyString = (value: any): value is string => typeof value === "string" && value.trim() !== "";
	const isPositiveInteger = (value: any): value is number =>
		typeof value === "number" && value >= 0 && Number.isInteger(value);
	// Check types and values
	if (!isNonEmptyString(section.id) ||
		!isNonEmptyString(section.Course) ||
		!isNonEmptyString(section.Title) ||
		!isNonEmptyString(section.Professor) ||
		!isNonEmptyString(section.Subject)
	) {
		return false;
	}

	if (!isPositiveInteger(section.Year) ||
		!isPositiveInteger(section.Pass) ||
		!isPositiveInteger(section.Fail) ||
		!isPositiveInteger(section.Audit)
	) {
		return false;
	}

	return true;
};
