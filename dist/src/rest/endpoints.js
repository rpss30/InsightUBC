"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatasets = exports.query = exports.deleteDataset = exports.submitDataset = void 0;
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const responses_1 = require("./responses");
async function submitDataset(req, res) {
    const facade = new InsightFacade_1.default();
    const id = req.params.id;
    const kind = req.params.kind;
    const content = Buffer.from(req.body).toString("base64");
    try {
        const response = await facade.addDataset(id, content, kind);
        (0, responses_1.sendDatasetResult)(res, response);
    }
    catch (error) {
        (0, responses_1.sendFacadeError)(res, error, "Unable to add dataset.");
    }
}
exports.submitDataset = submitDataset;
async function deleteDataset(req, res) {
    const facade = new InsightFacade_1.default();
    const id = req.params.id;
    try {
        const response = await facade.removeDataset(id);
        (0, responses_1.sendDatasetResult)(res, response);
    }
    catch (error) {
        (0, responses_1.sendFacadeError)(res, error, "Unable to delete dataset.");
    }
}
exports.deleteDataset = deleteDataset;
async function query(req, res) {
    const facade = new InsightFacade_1.default();
    const queryBody = req.body;
    try {
        const result = await facade.performQuery(queryBody);
        (0, responses_1.sendResult)(res, result);
    }
    catch (error) {
        (0, responses_1.sendFacadeError)(res, error, "Query failed.");
    }
}
exports.query = query;
async function getDatasets(req, res) {
    const facade = new InsightFacade_1.default();
    try {
        const response = await facade.listDatasets();
        (0, responses_1.sendResult)(res, response);
    }
    catch (error) {
        (0, responses_1.sendFacadeError)(res, error, "Failed to list datasets.");
    }
}
exports.getDatasets = getDatasets;
//# sourceMappingURL=endpoints.js.map