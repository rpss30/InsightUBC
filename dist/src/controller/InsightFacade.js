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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const parseUtil_1 = require("../utils/parseUtil");
const jszip_1 = __importDefault(require("jszip"));
const performQueryHelpers_1 = require("../utils/performQueryHelpers");
const fs = __importStar(require("fs"));
const queryGuard_1 = require("../utils/queryGuard");
const processDatasetUtil_1 = require("../utils/processDatasetUtil");
class InsightFacade {
    async addDataset(id, content, kind) {
        if (!id || id.trim() === "" || id.includes("_")) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid ID"));
        }
        if (kind !== IInsightFacade_1.InsightDatasetKind.Sections && kind !== IInsightFacade_1.InsightDatasetKind.Rooms) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid Dataset Kind"));
        }
        const currentDatasets = await this.listDatasets();
        if (currentDatasets.some((dataset) => dataset.id === id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("A dataset with this name has already been added."));
        }
        let zip = new jszip_1.default();
        await zip.loadAsync(content, { base64: true }).catch((error) => {
            return Promise.reject(new IInsightFacade_1.InsightError("Unable to process ZIP file:" + error));
        });
        if (Object.keys(zip.files).length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("Empty zip file"));
        }
        if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
            return await (0, processDatasetUtil_1.processSection)(zip, id, kind);
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            return await (0, processDatasetUtil_1.processRoom)(zip, id, kind);
        }
        else {
            return Promise.reject("Type Error: Invalid Dataset Kind");
        }
    }
    async removeDataset(id) {
        if (!id || id.trim() === "" || id.includes("_")) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid ID"));
        }
        const currentDatasets = await this.listDatasets();
        let broken = false;
        for (const dataset of currentDatasets) {
            if (dataset.id === id) {
                broken = true;
                break;
            }
        }
        if (!broken) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("This dataset does not exist."));
        }
        fs.unlinkSync(__dirname + "/../../data/" + id);
        const manifest = fs.readFileSync(__dirname + "/../../data/_manifest", "utf8");
        const datasets = manifest.split(/\n/g);
        const newManifestString = datasets.filter((dataset) => !dataset.includes(id)).join("");
        fs.writeFileSync(__dirname + "/../../data/_manifest", newManifestString, { flag: "w" });
        return Promise.resolve(id);
    }
    async listDatasets() {
        if (!fs.existsSync(__dirname + "/../../data")) {
            fs.mkdirSync(__dirname + "/../../data");
        }
        if (!fs.readdirSync(__dirname + "/../../data").includes("_manifest")) {
            return Promise.resolve([]);
        }
        const manifest = fs.readFileSync(__dirname + "/../../data/_manifest", "utf8");
        const datasets = manifest.split(/\n/g).filter((dataset) => dataset.length > 0);
        const datasetsAsInsightDataset = datasets.map((line) => {
            const t = line.split("_");
            const r = { id: t[0],
                kind: (t[1] === "sections" ? IInsightFacade_1.InsightDatasetKind.Sections : IInsightFacade_1.InsightDatasetKind.Rooms),
                numRows: parseInt(t[2], 10) };
            return r;
        });
        return Promise.resolve(datasetsAsInsightDataset);
    }
    async retrieveDatasets(id) {
        const currentDatasets = await this.listDatasets();
        if (!currentDatasets.some((dataset) => dataset.id === id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("No datasets added."));
        }
        const dataset = fs.readFileSync(__dirname + "/../../data/" + id, "utf8");
        const datasetParsed = JSON.parse(dataset);
        return Promise.resolve(datasetParsed);
    }
    async performQuery(query) {
        let results = [];
        const parsed = (0, parseUtil_1.safeParse)(queryGuard_1.queryGuard)(JSON.stringify(query));
        if (parsed.didProduceError) {
            return Promise.reject(new IInsightFacade_1.InsightError("Syntax Error: Unable to parse query"));
        }
        let id;
        if (Object.keys(query.WHERE).length === 0) {
            const extractID = (input) => {
                const index = input.indexOf("_");
                if (index !== -1) {
                    return input.substring(0, index);
                }
                return input;
            };
            id = extractID(query.OPTIONS.COLUMNS[0]);
        }
        else {
            id = (0, performQueryHelpers_1.getID)(query.WHERE);
        }
        results = await this.retrieveDatasets(id);
        (0, performQueryHelpers_1.prefixID)(results, id);
        let filteredResults = (0, performQueryHelpers_1.applyFilters)(query.WHERE, results);
        if (query.TRANSFORMATIONS) {
            filteredResults = (0, performQueryHelpers_1.applyTransformations)(query.TRANSFORMATIONS, filteredResults);
        }
        if (query.OPTIONS.ORDER) {
            filteredResults = (0, performQueryHelpers_1.applyOPTIONS)(query, filteredResults);
        }
        filteredResults = (0, performQueryHelpers_1.applyColumns)(query.OPTIONS.COLUMNS, filteredResults);
        if (filteredResults.length > 5000) {
            throw new IInsightFacade_1.ResultTooLargeError("Result set contains more than 5000 records.");
        }
        return filteredResults;
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map