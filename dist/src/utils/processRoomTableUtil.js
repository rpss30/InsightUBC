"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndReturnRooms = void 0;
const BuildingRoom_1 = require("../model/BuildingRoom");
const parse5_1 = require("parse5");
const processDatasetUtil_1 = require("./processDatasetUtil");
const assert_1 = __importDefault(require("assert"));
function validateAndReturnRooms(building, roomFile) {
    const roomDom = (0, parse5_1.parse)(roomFile);
    const roomTable = (0, processDatasetUtil_1.findOuterElementByInnerTagAndClass)(roomDom, "td", BuildingRoom_1.requiredRoomClasses, "table");
    if (!roomTable) {
        return [];
    }
    const rooms = processRoomTable(roomTable);
    return (0, BuildingRoom_1.combineBuildingAndRooms)(building, rooms);
}
exports.validateAndReturnRooms = validateAndReturnRooms;
function getValueByClass(node, className, valueType) {
    for (const cell of node.childNodes) {
        if (cell.nodeName !== "td") {
            continue;
        }
        const cellClasses = cell.attrs?.find((attr) => attr.name === "class")?.value.split(/[ ,]+/) || [];
        if (cellClasses.includes(className)) {
            const targetNode = (valueType === "href" || valueType === "valueInHref")
                ? cell.childNodes.find((n) => n.nodeName === "a")
                : cell.childNodes.find((n) => (0, BuildingRoom_1.isText)(n));
            (0, assert_1.default)(targetNode);
            let value;
            if (valueType === "href") {
                (0, assert_1.default)("attrs" in targetNode);
                value = targetNode?.attrs.find((attr) => attr.name === "href")?.value;
            }
            else if (valueType === "valueInHref" && "childNodes" in targetNode) {
                const anode = targetNode.childNodes.find((n) => (0, BuildingRoom_1.isText)(n));
                if (!anode || !("value" in anode)) {
                    return undefined;
                }
                value = anode.value.trim();
            }
            else if ("value" in targetNode && (0, BuildingRoom_1.isText)(targetNode)) {
                value = targetNode.value.trim();
            }
            return value;
        }
    }
    return undefined;
}
function processRoomTable(table) {
    let rooms = [];
    if (!(0, BuildingRoom_1.isElement)(table)) {
        return [];
    }
    let t;
    if (table.nodeName === "tr") {
        const number = getValueByClass(table, "views-field-field-room-number", "valueInHref");
        const seats = getValueByClass(table, "views-field-field-room-capacity", "text");
        const furniture = getValueByClass(table, "views-field-field-room-furniture", "text");
        const type = getValueByClass(table, "views-field-field-room-type", "text");
        const href = getValueByClass(table, "views-field-field-room-number", "href");
        const name = "";
        if (number !== undefined
            && seats !== undefined
            && furniture !== undefined
            && type !== undefined
            && href !== undefined) {
            return [{ number: number, seats: Number(seats), furniture: furniture, type: type, href: href, name: name }];
        }
        else {
            return [];
        }
    }
    for (const childNode of table.childNodes) {
        if (!(0, BuildingRoom_1.isElement)(childNode)) {
            continue;
        }
        rooms.push(...processRoomTable(childNode));
    }
    return rooms;
}
//# sourceMappingURL=processRoomTableUtil.js.map