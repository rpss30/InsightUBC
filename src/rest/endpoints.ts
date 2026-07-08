import {Request, Response} from "express";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {sendDatasetResult, sendFacadeError, sendResult} from "./responses";

export async function submitDataset(req: Request, res: Response): Promise<void> {
	const facade = new InsightFacade();
	const id = req.params.id;
	const kind = req.params.kind as InsightDatasetKind;
	const content = Buffer.from(req.body).toString("base64");

	try {
		const response = await facade.addDataset(id, content, kind);
		sendDatasetResult(res, response);
	} catch (error) {
		sendFacadeError(res, error, "Unable to add dataset.");
	}
}

export async function deleteDataset(req: Request, res: Response): Promise<void> {
	const facade = new InsightFacade();
	const id = req.params.id;

	try {
		const response = await facade.removeDataset(id);
		sendDatasetResult(res, response);
	} catch (error) {
		sendFacadeError(res, error, "Unable to delete dataset.");
	}
}


export async function query(req: Request, res: Response): Promise<void> {
	const facade = new InsightFacade();
	const queryBody = req.body;

	try {
		const result = await facade.performQuery(queryBody);
		sendResult(res, result);
	} catch (error) {
		sendFacadeError(res, error, "Query failed.");
	}
}


export async function getDatasets(req: Request, res: Response): Promise<void> {
	const facade = new InsightFacade();

	try {
		const response = await facade.listDatasets();
		sendResult(res, response);
	} catch (error) {
		sendFacadeError(res, error, "Failed to list datasets.");
	}
}
