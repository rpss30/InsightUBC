import {
	Building,
	BuildingRoom, combineBuildingAndRooms,
	isElement,
	isText,
	requiredRoomClasses,
	Room
} from "../model/BuildingRoom";
import {parse} from "parse5";
import {Element} from "parse5/dist/tree-adapters/default";
import {findOuterElementByInnerTagAndClass} from "./processDatasetUtil";
import assert from "assert";

export function validateAndReturnRooms(building: Building, roomFile: string): BuildingRoom[] {
	const roomDom = parse(roomFile);
	const roomTable = findOuterElementByInnerTagAndClass(roomDom, "td", requiredRoomClasses, "table");

	if (!roomTable) {
		return [];
	}

	// Navigate through the table to process each row
	const rooms: Room[] = processRoomTable(roomTable);

	return combineBuildingAndRooms(building, rooms);
}

// The following function was created with some help from Chat-GPT

function getValueByClass(node: Element, className: string, valueType: "href"|"text"|"valueInHref"): string | undefined {
	for (const cell of node.childNodes) {
		if (cell.nodeName !== "td") {
			continue;
		}

		const cellClasses = cell.attrs?.find((attr) => attr.name === "class")?.value.split(/[ ,]+/) || [];
		if (cellClasses.includes(className)) {
			const targetNode = (valueType === "href" || valueType === "valueInHref")
				? cell.childNodes.find((n) => n.nodeName === "a")
				: cell.childNodes.find((n) => isText(n));

			assert(targetNode);
			let value;

			if (valueType === "href")  {
				assert("attrs" in targetNode);
				value = targetNode?.attrs.find((attr) => attr.name === "href")?.value;
			} else if (valueType === "valueInHref" && "childNodes" in targetNode) {
				const anode = targetNode.childNodes.find((n) => isText(n));
				if (!anode || !("value" in anode)) {
					return undefined;
				}
				value = anode.value.trim();
			} else if ("value" in targetNode && isText(targetNode)) {
				value = targetNode.value.trim();
			}

			return value;
		}
	}
	return undefined;
}

function processRoomTable(table: Element): Room[] {
	let rooms: Room[] = [];

	if (!isElement(table)) {
		return [];
	}

	// If we have reached a table row, we can process its cells
	let t;
	if (table.nodeName === "tr") {
		const number = getValueByClass(table, "views-field-field-room-number", "valueInHref");
		const seats =  getValueByClass(table, "views-field-field-room-capacity", "text") ;
		const furniture = getValueByClass(table, "views-field-field-room-furniture", "text");
		const type = getValueByClass(table, "views-field-field-room-type", "text");
		const href = getValueByClass(table, "views-field-field-room-number", "href");
		const name = "";

		if (number !== undefined
			&& seats !== undefined
			&& furniture !== undefined
			&& type !== undefined
			&& href !== undefined) {
			return [{number: number, seats: Number(seats), furniture: furniture, type: type, href: href, name: name}];
		} else {
			return [];
		}
	}

	// This is where we keep seaching for the row
	for (const childNode of table.childNodes) {
		if (!isElement(childNode)) {
			continue;
		}
		rooms.push(...processRoomTable(childNode));
	}

	return rooms;
}

