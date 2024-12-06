"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBuildingTable = void 0;
const BuildingRoom_1 = require("../model/BuildingRoom");
const fetchUtil_1 = require("./fetchUtil");
const assert_1 = __importDefault(require("assert"));
async function processBuildingTable(node) {
    const buildings = [];
    const childTableBody = node.childNodes.find((child) => child.nodeName === "tbody");
    let tbody;
    if (childTableBody !== undefined && (0, BuildingRoom_1.isElement)(childTableBody)) {
        tbody = childTableBody;
    }
    else {
        return [];
    }
    for await (const row of tbody.childNodes) {
        if (row.nodeName === "#text" || !(0, BuildingRoom_1.isElement)(row)) {
            continue;
        }
        let classCounter = {};
        for (let className of BuildingRoom_1.requiredBuildingClasses) {
            classCounter[className] = 0;
        }
        for (const cell of row.childNodes) {
            if (cell.nodeName === "#text" || !(0, BuildingRoom_1.isElement)(cell)) {
                continue;
            }
            const cellClasses = cell.attrs?.find((attr) => attr.name === "class")?.value.split(/[ ,]+/) || [];
            for (const className of cellClasses) {
                if (BuildingRoom_1.requiredBuildingClasses.includes(className)) {
                    classCounter[className]++;
                    break;
                }
            }
        }
        if (!BuildingRoom_1.requiredBuildingClasses.every((className) => classCounter[className] === 1)) {
            return [];
        }
        else {
            const rowAsBuilding = await getBuildingWithGeo(row);
            if (rowAsBuilding instanceof BuildingRoom_1.HTMLParseError) {
                return rowAsBuilding;
            }
            else {
                buildings.push(rowAsBuilding);
            }
        }
    }
    return buildings;
}
exports.processBuildingTable = processBuildingTable;
async function getBuildingWithGeo(row) {
    const buildingOrError = tableRowToBuilding(row);
    if (buildingOrError instanceof BuildingRoom_1.HTMLParseError) {
        return buildingOrError;
    }
    try {
        const geoResponse = await fetchAddress(buildingOrError.address);
        buildingOrError.lat = (geoResponse.lat ? geoResponse.lat : 0);
        buildingOrError.lon = (geoResponse.lon ? geoResponse.lon : 0);
    }
    catch (error) {
        console.error("Failed to fetch address:", error);
    }
    return buildingOrError;
}
function tableRowToBuilding(row) {
    const buildings = [];
    let fullname, shortname, address, uri;
    for (const cell of row.childNodes) {
        if (cell.nodeName === "#text" || !(0, BuildingRoom_1.isElement)(cell)) {
            continue;
        }
        const cellClasses = cell.attrs?.find((attr) => attr.name === "class")?.value.split(/[ ,]+/) || [];
        if (cellClasses.includes("views-field-field-building-code")) {
            const tnode = cell.childNodes.find((node) => node.nodeName === "#text");
            if (tnode && "value" in tnode) {
                shortname = tnode.value.trim();
            }
            else {
                return new BuildingRoom_1.HTMLParseError("Missing shortcode" + tnode);
            }
        }
        else if (cellClasses.includes("views-field-title")) {
            const tnode = cell.childNodes.find((node) => node.nodeName === "a");
            if (tnode && "childNodes" in tnode) {
                const anode = tnode.childNodes.find((node) => (0, BuildingRoom_1.isText)(node));
                uri = tnode.attrs.find((attr) => attr.name === "href")?.value;
                if (anode && "value" in anode) {
                    fullname = anode.value.trim();
                }
                else {
                    return new BuildingRoom_1.HTMLParseError("Missing fullname" + anode);
                }
            }
        }
        else if (cellClasses.includes("views-field-field-building-address")) {
            const tnode = cell.childNodes.find((node) => (0, BuildingRoom_1.isText)(node));
            if (tnode && "value" in tnode) {
                address = tnode.value.trim();
            }
            else {
                return new BuildingRoom_1.HTMLParseError("Missing Address" + tnode);
            }
        }
    }
    if (fullname === undefined || shortname === undefined || address === undefined || uri === undefined) {
        return new BuildingRoom_1.HTMLParseError("There was an issue extracting building data.");
    }
    return { fullname: fullname, shortname: shortname, address: address, uri: uri, lat: 0, lon: 0 };
}
async function fetchAddress(address) {
    const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team138/${encodeURI(address)}`;
    const response = await (0, fetchUtil_1.fetchData)(url);
    const parsed = JSON.parse(response);
    (0, assert_1.default)((0, BuildingRoom_1.isGeoResponse)(parsed));
    return Promise.resolve(parsed);
}
//# sourceMappingURL=processBuildingTableUtil.js.map