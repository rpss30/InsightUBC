"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatasets = exports.query = exports.deleteDataset = exports.submitDataset = void 0;
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
function submitDataset(req, res) {
    const facade = new InsightFacade_1.default();
    const id = req.params.id;
    const kind = req.params.kind;
    const content = Buffer.from(req.body).toString("base64");
    facade.addDataset(id, content, kind)
        .then((response) => {
        res.set("HX-Trigger", "refreshDatasets");
        res.status(200).json({ result: response });
    })
        .catch((e) => {
        res.status(400).json({ error: "Unable to add dataset: " + e });
    });
}
exports.submitDataset = submitDataset;
function deleteDataset(req, res) {
    const facade = new InsightFacade_1.default();
    const id = req.params.id;
    facade.removeDataset(id)
        .then((response) => {
        res.set("HX-Trigger", "refreshDatasets");
        res.status(200).json({ result: response });
    })
        .catch((e) => {
        if (e instanceof IInsightFacade_1.NotFoundError) {
            res.status(404).json({ error: "Dataset not found: " + e });
        }
        else {
            res.status(400).json({ error: "Unable to delete dataset: " + e });
        }
    });
}
exports.deleteDataset = deleteDataset;
function query(req, res) {
    const facade = new InsightFacade_1.default();
    const queryBody = req.body;
    facade.performQuery(queryBody)
        .then((result) => {
        res.status(200).json({ result: result });
    })
        .catch((e) => {
        console.error("Error performing query:", e);
        res.status(400).json({ error: "Query failed: " + e });
    });
}
exports.query = query;
function getDatasets(req, res) {
    const facade = new InsightFacade_1.default();
    facade.listDatasets()
        .then((response) => {
        res.status(200).json({ result: response });
    })
        .catch((e) => {
        console.error("Error listing datasets:", e);
        res.status(500).json({ error: "Failed to list datasets" });
    });
}
exports.getDatasets = getDatasets;
//# sourceMappingURL=endpoints.js.map