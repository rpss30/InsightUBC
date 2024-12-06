// Defines a building
import {ChildNode, CommentNode, Document, Element, TextNode} from "parse5/dist/tree-adapters/default";

export interface Building {
	[index: string]: string | number;
	fullname: string;
	shortname: string;
	address: string;
	uri: string;
	lat: number;
	lon: number;
}

// Defines a room
export interface Room {
	[index: string]: string | number;
	number: string;
	name: string;
	seats: number;
	type: string;
	furniture: string;
	href: string;
}

// Combined building-room type
export type BuildingRoom = Building & Room;


// For geolocation response
export interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export function isGeoResponse(o: any): o is GeoResponse {
	return ("lat" in o && "lon" in o) || "error" in o;
}

export class HTMLParseError extends Error {
	constructor(msg: string) {
		super(msg);

		// Set the prototype explicitly.
		Object.setPrototypeOf(this, HTMLParseError.prototype);
	}

	// print() {
	// 	return "Error" + this.message;
	// }
}

export const requiredBuildingClasses = [
	"views-field-field-building-image",
	"views-field-field-building-code",
	"views-field-title",
	"views-field-field-building-address",
	"views-field-nothing"
];

export const requiredRoomClasses = [
	"views-field-field-room-number",
	"views-field-field-room-capacity",
	"views-field-field-room-furniture",
	"views-field-field-room-type",
	"views-field-nothing"
];

export function isElement(node: ChildNode | Document): node is Element {
	return ("childNodes" in node && "tagName" in node && "attrs" in node);
}

export function isDocument(node: ChildNode | Document): node is Document {
	return "nodeName" in node && node.nodeName === "#document";
}

export function isComment(node: ChildNode): node is CommentNode | TextNode {
	return node.nodeName === "#comment";
}

export function isText(node: ChildNode): node is TextNode {
	return node.nodeName === "#text";
}

export function combineBuildingAndRooms(building: Building, rooms: Room[]): BuildingRoom[] {
	const buildingRooms: BuildingRoom[] = [];
	for (const room of rooms) {
		let buildingRoom: BuildingRoom = {...building, ...room};
		buildingRoom.name = `${building.shortname}_${room.number}`;
		buildingRooms.push(buildingRoom);
	}

	return buildingRooms;
}
