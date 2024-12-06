import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "./IInsightFacade";
import {ParseResult, safeParse} from "../utils/parseUtil";
import JSZip from "jszip";
import {
	applyColumns,
	applyFilters, applyOPTIONS,
	applyTransformations, getID,
	prefixID
} from "../utils/performQueryHelpers";
import * as fs from "fs";
import {Query} from "../model/Query";
import {queryGuard} from "../utils/queryGuard";
import {processRoom, processSection} from "../utils/processDatasetUtil";
import {BuildingRoom} from "../model/BuildingRoom";
import {Section} from "../model/Section";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Check ID
		if (!id || id.trim() === "" || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid ID"));
		}

		// Check Kind
		if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
			return Promise.reject(new InsightError("Invalid Dataset Kind"));
		}

		// Make sure the dataset isn't already added
		const currentDatasets: InsightDataset[] = await this.listDatasets();

		if (currentDatasets.some((dataset) => dataset.id === id)) {
			return Promise.reject(new InsightError("A dataset with this name has already been added."));
		}

		// Unzip the file

		let zip: JSZip = new JSZip();
		await zip.loadAsync(content, {base64: true}).catch((error) => {
			return Promise.reject(new InsightError("Unable to process ZIP file:" + error));
		});

		if (Object.keys(zip.files).length === 0) {
			return Promise.reject(new InsightError("Empty zip file"));
		}

		// Handle archive according to type
		if (kind === InsightDatasetKind.Sections) {
			return await processSection(zip, id, kind);
		} else if (kind === InsightDatasetKind.Rooms) {
			return await processRoom(zip, id, kind);
		} else {
			return Promise.reject("Type Error: Invalid Dataset Kind");
		}
	}


	public async removeDataset(id: string): Promise<string> {
		// Check ID
		if (!id || id.trim() === "" || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid ID"));
		}

		// Make sure the dataset isn't already added
		const currentDatasets: InsightDataset[] = await this.listDatasets();

		let broken = false;

		for (const dataset of currentDatasets) {
			if (dataset.id === id) {
				broken = true;
				break;
			}
		}

		if (!broken) {
			return Promise.reject(new NotFoundError("This dataset does not exist."));
		}

		// Delete the dataset file
		fs.unlinkSync(__dirname + "/../../data/" + id);

		// Update the manifest file
		const manifest: string = fs.readFileSync(__dirname + "/../../data/_manifest", "utf8");

		const datasets: string[] = manifest.split(/\n/g);

		const newManifestString: string  = datasets.filter((dataset) => !dataset.includes(id)).join("");

		// Write new manifest file
		fs.writeFileSync(__dirname + "/../../data/_manifest", newManifestString, {flag: "w"});

		// Fulfill
		return Promise.resolve(id);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// Make sure data exists
		if (!fs.existsSync(__dirname + "/../../data")) {
			fs.mkdirSync(__dirname + "/../../data");
		}

		if (!fs.readdirSync(__dirname + "/../../data").includes("_manifest")) {
			return Promise.resolve([]);
		}

		const manifest: string = fs.readFileSync(__dirname + "/../../data/_manifest", "utf8");

		const datasets: string[] = manifest.split(/\n/g).filter((dataset) => dataset.length > 0);

		// make a new array consisting of InsightDataset objects from the array above
		const datasetsAsInsightDataset: InsightDataset[] = datasets.map((line) => {
			const t: string[] = line.split("_");
			const r: InsightDataset = {id: t[0],
				kind: (t[1] === "sections" ? InsightDatasetKind.Sections : InsightDatasetKind.Rooms),
				numRows: parseInt(t[2], 10)};
			return r;
		});

		// Return array of InsightDataset objects
		return Promise.resolve(datasetsAsInsightDataset);
	}

	public async retrieveDatasets(id: string): Promise<Array<Section | BuildingRoom>> {
		// Make sure data exists
		const currentDatasets: InsightDataset[] = await this.listDatasets();
		if (!currentDatasets.some((dataset) => dataset.id === id)) {
			return Promise.reject(new InsightError("No datasets added."));
		}

		const dataset: string = fs.readFileSync(__dirname + "/../../data/" + id, "utf8");

		const datasetParsed: Section[] = JSON.parse(dataset);

		return Promise.resolve(datasetParsed);
	}

	/*
	 All the code and helper functions for performQuery start from here
	 */
	public async performQuery(query: Query): Promise<InsightResult[]> {
		// Initializes an array to store the results
		let results: Array<Section | BuildingRoom> = [];

		// Safely parses the dataset
		const parsed: ParseResult<Query> = safeParse(queryGuard)(JSON.stringify(query));

		if (parsed.didProduceError) {
			return Promise.reject(new InsightError("Syntax Error: Unable to parse query"));
		}

		// Extracts the ID of the dataset
		let id;
		if (Object.keys(query.WHERE).length === 0) {
			const extractID = (input: string): string => {
				const index = input.indexOf("_");
				if (index !== -1) {
					return input.substring(0, index);
				}
				return input;
			};
			id = extractID(query.OPTIONS.COLUMNS[0]);
		} else {
			id = getID(query.WHERE);
		}

		results = await this.retrieveDatasets(id);

		// prefixes every key with the dataset ID
		prefixID(results, id);

		// Filtering
		let filteredResults: InsightResult[] = applyFilters(query.WHERE, results);

		// Transformations
		if (query.TRANSFORMATIONS) {
			filteredResults = applyTransformations(query.TRANSFORMATIONS, filteredResults);
		}

		// Sorting
		if (query.OPTIONS.ORDER) {
			filteredResults = applyOPTIONS(query, filteredResults);
		}

		// Columns
		filteredResults = applyColumns(query.OPTIONS.COLUMNS, filteredResults);

		if (filteredResults.length > 5000) {
			throw new ResultTooLargeError("Result set contains more than 5000 records.");
		}

		return filteredResults;
	}
}
