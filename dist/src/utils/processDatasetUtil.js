"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOuterElementByInnerTagAndClass = exports.processRoom = exports.processSection = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
const parseUtil_1 = require("./parseUtil");
const transformUtil_1 = require("./transformUtil");
const fs_1 = __importDefault(require("fs"));
const parse5_1 = require("parse5");
const BuildingRoom_1 = require("../model/BuildingRoom");
const processBuildingTableUtil_1 = require("./processBuildingTableUtil");
const processRoomTableUtil_1 = require("./processRoomTableUtil");
async function processSection(zip, id, kind) {
    const filePromises = [];
    zip.folder("courses")?.forEach((relativeDirectory, file) => {
        filePromises.push(file.async("string"));
    });
    if (filePromises.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No courses in zip."));
    }
    const sectionDataAsString = await Promise.all(filePromises);
    const sectionDataAsSection = [];
    if (sectionDataAsString[0] === "") {
        sectionDataAsString.shift();
    }
    for (const sectionString of sectionDataAsString) {
        if (sectionString.length === 0) {
            continue;
        }
        const parsed = (0, parseUtil_1.safeParse)(parseUtil_1.sectionGuard)(sectionString);
        if (parsed.didProduceError) {
            continue;
        }
        const sectionDataAsFileSection = ("result" in parsed.parsed ? parsed.parsed.result : [parsed.parsed]);
        sectionDataAsSection.push(...sectionDataAsFileSection.map(transformUtil_1.transformSection));
    }
    if (sectionDataAsSection.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid sections."));
    }
    fs_1.default.mkdir(__dirname + "/../../data", { recursive: true }, (err) => {
        if (err) {
            return Promise.reject(new IInsightFacade_1.InsightError(err.message));
        }
    });
    fs_1.default.writeFileSync(__dirname + "/../../data/" + id, JSON.stringify(sectionDataAsSection), { flag: "w" });
    fs_1.default.writeFileSync(__dirname + "/../../data/_manifest", `${id}_${kind}_${sectionDataAsSection.length}\n`, { flag: "a" });
    return Promise.resolve(fs_1.default.readdirSync(__dirname + "/../../data/").filter((t) => !t.includes("_")));
}
exports.processSection = processSection;
async function processRoom(zip, id, kind) {
    let indexFile;
    try {
        indexFile = await zip.file("index.htm")?.async("text");
        if (indexFile === undefined) {
            return Promise.reject(new IInsightFacade_1.InsightError("index.htm not found."));
        }
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError("An error occurred reading index.html: "));
    }
    const index = (0, parse5_1.parse)(indexFile);
    const buildingTable = (0, exports.findOuterElementByInnerTagAndClass)(index, "td", BuildingRoom_1.requiredBuildingClasses, "table");
    if (buildingTable === null) {
        return Promise.reject("No building table found.");
    }
    const buildings = await (0, processBuildingTableUtil_1.processBuildingTable)(buildingTable);
    if (buildings instanceof BuildingRoom_1.HTMLParseError) {
        return Promise.reject(new IInsightFacade_1.InsightError("Problem parsing html: " + buildings));
    }
    const roomsTable = [];
    for await (const building of buildings) {
        const file = await zip.file(building.uri.replace("./", ""))?.async("text");
        if (!file) {
            continue;
        }
        roomsTable.push(...(0, processRoomTableUtil_1.validateAndReturnRooms)(building, file));
    }
    if (roomsTable.length === 0) {
        return Promise.reject("This dataset doesn't contain any rooms.");
    }
    fs_1.default.mkdir(__dirname + "/../../data", { recursive: true }, (err) => {
        if (err) {
            return Promise.reject(new IInsightFacade_1.InsightError(err.message));
        }
    });
    fs_1.default.writeFileSync(__dirname + "/../../data/" + id, JSON.stringify(roomsTable), { flag: "w" });
    fs_1.default.writeFileSync(__dirname + "/../../data/_manifest", `${id}_${kind}_${roomsTable.length}\n`, { flag: "a" });
    return Promise.resolve(fs_1.default.readdirSync(__dirname + "/../../data/").filter((t) => !t.includes("_")));
}
exports.processRoom = processRoom;
const findOuterElementByInnerTagAndClass = (node, tagID, innerClassNames, outerClassTagID) => {
    if ((0, BuildingRoom_1.isDocument)(node)) {
        for (const childNode of node.childNodes) {
            const result = (0, exports.findOuterElementByInnerTagAndClass)(childNode, tagID, innerClassNames, outerClassTagID);
            if (result !== null) {
                return result;
            }
        }
        return null;
    }
    if (!("tagName" in node)) {
        return null;
    }
    if ((0, BuildingRoom_1.isComment)(node) || (0, BuildingRoom_1.isText)(node)) {
        return null;
    }
    if (node.nodeName === "head") {
        return null;
    }
    for (const childNode of node.childNodes) {
        if ((0, BuildingRoom_1.isElement)(childNode) && childNode.tagName === tagID) {
            for (const attr of childNode.attrs) {
                if (attr.name === "class" && innerClassNames.some((className) => attr.value.includes(className))) {
                    return childNode;
                }
            }
        }
        const result = (0, exports.findOuterElementByInnerTagAndClass)(childNode, tagID, innerClassNames, outerClassTagID);
        if (result !== null &&
            result.tagName === tagID &&
            (node.tagName === outerClassTagID || outerClassTagID === null)) {
            return node;
        }
        else if (result !== null) {
            return result;
        }
    }
    return null;
};
exports.findOuterElementByInnerTagAndClass = findOuterElementByInnerTagAndClass;
const validateFields = (section) => {
    const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";
    const isPositiveInteger = (value) => typeof value === "number" && value >= 0 && Number.isInteger(value);
    if (!isNonEmptyString(section.id) ||
        !isNonEmptyString(section.Course) ||
        !isNonEmptyString(section.Title) ||
        !isNonEmptyString(section.Professor) ||
        !isNonEmptyString(section.Subject)) {
        return false;
    }
    if (!isPositiveInteger(section.Year) ||
        !isPositiveInteger(section.Pass) ||
        !isPositiveInteger(section.Fail) ||
        !isPositiveInteger(section.Audit)) {
        return false;
    }
    return true;
};
//# sourceMappingURL=processDatasetUtil.js.map