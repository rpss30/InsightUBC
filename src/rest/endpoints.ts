import {Request, Response} from "express";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";
import fs from "fs";

export function submitDataset(req: Request, res: Response) {
	const facade = new InsightFacade();
	const id = req.params.id;
	const kind = req.params.kind as InsightDatasetKind;
	const content = Buffer.from(req.body).toString("base64");

	facade.addDataset(id, content, kind)
		.then((response) => {
			res.set("HX-Trigger", "refreshDatasets");
			res.status(200).json({result: response});
		})
		.catch((e) => {
			// Assuming all failures for addDataset should result in a 400 error as per your specification.
			res.status(400).json({error: "Unable to add dataset: " + e});
		});
}

export function deleteDataset(req: Request, res: Response) {
	const facade = new InsightFacade();
	const id = req.params.id;

	facade.removeDataset(id)
		.then((response) => {
			res.set("HX-Trigger", "refreshDatasets");
			res.status(200).json({result: response});
		})
		.catch((e) => {
			if (e instanceof NotFoundError) {
				res.status(404).json({error: "Dataset not found: " + e});
			} else {
				// InsightError or any other error
				res.status(400).json({error: "Unable to delete dataset: " + e});
			}
		});
}


export function query(req: Request, res: Response) {
	const facade = new InsightFacade();
	// Assuming req.body is the query in JSON format.
	const queryBody = req.body;

	facade.performQuery(queryBody)
		.then((result) => {
			res.status(200).json({result: result});
		})
		.catch((e) => {
			console.error("Error performing query:", e);
			res.status(400).json({error: "Query failed: " + e});
		});
}


export function getDatasets(req: Request, res: Response) {
	const facade = new InsightFacade();

	facade.listDatasets()
		.then((response) => {
			res.status(200).json({result: response});
		})
		.catch((e) => {
			// Depending on how listDatasets() is implemented, you might or might not need error handling here.
			console.error("Error listing datasets:", e);
			res.status(500).json({error: "Failed to list datasets"});
		});
}

