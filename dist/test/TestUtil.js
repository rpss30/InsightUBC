"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFileQueries = exports.clearDisk = exports.getContentFromArchives = void 0;
const fs = __importStar(require("fs-extra"));
const persistDir = "./data";
async function getContentFromArchives(name) {
    const buffer = await fs.readFile("test/resources/archives/" + name);
    return buffer.toString("base64");
}
exports.getContentFromArchives = getContentFromArchives;
async function clearDisk() {
    await fs.remove(persistDir);
}
exports.clearDisk = clearDisk;
function readFileQueries(path) {
    const fileNames = fs.readdirSync(`test/resources/queries/${path}`);
    const allQueries = [];
    for (const fileName of fileNames) {
        const fileQuery = fs.readJSONSync(`test/resources/queries/${path}/${fileName}`);
        allQueries.push(fileQuery);
    }
    return allQueries;
}
exports.readFileQueries = readFileQueries;
//# sourceMappingURL=TestUtil.js.map