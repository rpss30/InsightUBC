"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineBuildingAndRooms = exports.isText = exports.isComment = exports.isDocument = exports.isElement = exports.requiredRoomClasses = exports.requiredBuildingClasses = exports.HTMLParseError = exports.isGeoResponse = void 0;
function isGeoResponse(o) {
    return ("lat" in o && "lon" in o) || "error" in o;
}
exports.isGeoResponse = isGeoResponse;
class HTMLParseError extends Error {
    constructor(msg) {
        super(msg);
        Object.setPrototypeOf(this, HTMLParseError.prototype);
    }
}
exports.HTMLParseError = HTMLParseError;
exports.requiredBuildingClasses = [
    "views-field-field-building-image",
    "views-field-field-building-code",
    "views-field-title",
    "views-field-field-building-address",
    "views-field-nothing"
];
exports.requiredRoomClasses = [
    "views-field-field-room-number",
    "views-field-field-room-capacity",
    "views-field-field-room-furniture",
    "views-field-field-room-type",
    "views-field-nothing"
];
function isElement(node) {
    return ("childNodes" in node && "tagName" in node && "attrs" in node);
}
exports.isElement = isElement;
function isDocument(node) {
    return "nodeName" in node && node.nodeName === "#document";
}
exports.isDocument = isDocument;
function isComment(node) {
    return node.nodeName === "#comment";
}
exports.isComment = isComment;
function isText(node) {
    return node.nodeName === "#text";
}
exports.isText = isText;
function combineBuildingAndRooms(building, rooms) {
    const buildingRooms = [];
    for (const room of rooms) {
        let buildingRoom = { ...building, ...room };
        buildingRoom.name = `${building.shortname}_${room.number}`;
        buildingRooms.push(buildingRoom);
    }
    return buildingRooms;
}
exports.combineBuildingAndRooms = combineBuildingAndRooms;
//# sourceMappingURL=BuildingRoom.js.map