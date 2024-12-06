import {ChildNode, Element} from "parse5/dist/tree-adapters/default";
import {
	Building,
	GeoResponse,
	HTMLParseError,
	isElement,
	isGeoResponse,
	isText,
	requiredBuildingClasses
} from "../model/BuildingRoom";
import {fetchData} from "./fetchUtil";
import assert from "assert";

export async function processBuildingTable(node: Element): Promise<Building[] | HTMLParseError> {
	const buildings: Building[] = [];

	const childTableBody: ChildNode | undefined = node.childNodes.find((child) => child.nodeName === "tbody");

	// const tbody = findOuterElementByInnerTagAndClass(node, "tr", requiredBuildingClasses, null);
	//
	// if (!tbody) {
	// 	return [];
	// }

	let tbody: Element;

	// Ensure the tbody element exists and then cast it, otherwise return nothing.
	if (childTableBody !== undefined && isElement(childTableBody)) {
		tbody = childTableBody as Element;
	} else {
		return [];
	}

	// Loop over all table rows in tbody
	for await (const row of tbody.childNodes) {
		// Skip non-tr rows
		if (row.nodeName === "#text" || !isElement(row)) {
			continue;
		}

		let classCounter: {[key: string]: number} = {};

		// Initialize or reset the counter for required classes
		for (let className of requiredBuildingClasses) {
			classCounter[className] = 0;
		}

		// Loop over all td of tr
		for (const cell of row.childNodes) {
			if (cell.nodeName === "#text" || !isElement(cell)) {
				continue;
			}

			// Find all the classes
			const cellClasses: string[] = cell.attrs?.find((attr) => attr.name === "class")?.value.split(/[ ,]+/) || [];

			// Loop through the classes of td, and if one is required, increment it
			// We break early because each class should only appear in one td
			for (const className of cellClasses) {
				if (requiredBuildingClasses.includes(className)) {
					classCounter[className]++;
					break;
				}
			}
		}

		// Check if each required class was found exactly once
		if (!requiredBuildingClasses.every((className) => classCounter[className] === 1)) {
			return []; // Incorrect number of required classes found
		} else {
			// Otherwise, append to the list of buildings
			const rowAsBuilding: Building | HTMLParseError = await getBuildingWithGeo(row);
			if (rowAsBuilding instanceof HTMLParseError) {
				return rowAsBuilding;
			} else {
				buildings.push(rowAsBuilding);
			}
		}
	}

	return buildings;
}

async function getBuildingWithGeo(row: Element): Promise<Building | HTMLParseError> {
	const buildingOrError = tableRowToBuilding(row);

	// If the result is an error, directly return it.
	if (buildingOrError instanceof HTMLParseError) {
		return buildingOrError;
	}

	// At this point, buildingOrError is of type Building without lat and lon.
	try {
		const geoResponse = await fetchAddress(buildingOrError.address);
		// Directly modify the building object with lat and lon.
		buildingOrError.lat = (geoResponse.lat ? geoResponse.lat : 0);
		buildingOrError.lon = (geoResponse.lon ? geoResponse.lon : 0);
	} catch (error) {
		console.error("Failed to fetch address:", error);
	}

	return buildingOrError;
}

function tableRowToBuilding(row: Element): Building | HTMLParseError {
	const buildings: Building[] = [];

	// Loop over all td of tr
	let fullname, shortname, address, uri: string | undefined;

	for (const cell of row.childNodes) {
		if (cell.nodeName === "#text" || !isElement(cell)) {
			continue;
		}

		// Find all the classes, again
		const cellClasses: string[] = cell.attrs?.find((attr) => attr.name === "class")?.value.split(/[ ,]+/) || [];

		if (cellClasses.includes("views-field-field-building-code")) {
			// Find the text child node
			const tnode = cell.childNodes.find((node) => node.nodeName === "#text");

			// If it exists, set short name to it, otherwise return undefined because we are missing a shortcode
			if (tnode && "value" in tnode) {
				shortname = tnode.value.trim();
			} else {
				return new HTMLParseError("Missing shortcode" + tnode); // something is wrong with the html
			}
		} else if (cellClasses.includes("views-field-title")) {
			const tnode = cell.childNodes.find((node) => node.nodeName === "a");

			if (tnode && "childNodes" in tnode) {
				const anode = tnode.childNodes.find((node) => isText(node));
				uri = tnode.attrs.find((attr) => attr.name === "href")?.value;

				if (anode && "value" in anode) {
					fullname = anode.value.trim();
				} else {
					return new HTMLParseError("Missing fullname" + anode); // something is wrong with the html
				}
			}
		} else if (cellClasses.includes("views-field-field-building-address")) {
			const tnode = cell.childNodes.find((node) => isText(node));

			if (tnode && "value" in tnode) {
				address = tnode.value.trim();
			} else {
				return new HTMLParseError("Missing Address" + tnode); // something is wrong with the html
			}
		}
	}

	// If we haven't set any of these variables, something is wrong and we fail
	if (fullname === undefined || shortname === undefined || address === undefined || uri === undefined) {
		return new HTMLParseError("There was an issue extracting building data.");
	}

	return {fullname: fullname, shortname: shortname, address: address, uri: uri, lat: 0, lon: 0};
}

async function fetchAddress(address: string): Promise<GeoResponse> {
	const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team138/${encodeURI(address)}`;
	const response: string = await fetchData(url);
	const parsed = JSON.parse(response);

	assert(isGeoResponse(parsed));

	return Promise.resolve(parsed);
}
