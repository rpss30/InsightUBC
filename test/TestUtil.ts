import * as fs from "fs-extra";
import {ITestQuery} from "./controller/InsightFacade.spec";

/**
 * The directory where data is persisted.
 *
 * NOTE: this variable should _not_ be referenced from production code.
 */
const persistDir = "./data";

/**
 * Convert a file into a base64 string.
 *
 * @param name  The name of the file to be converted.
 *
 * @return Promise A base 64 representation of the file
 */
async function getContentFromArchives(name: string): Promise<string> {
	const buffer = await fs.readFile("test/resources/archives/" + name);
	return buffer.toString("base64");
}

/**
 * Removes all files within the persistDir.
 */
async function clearDisk(): Promise<void> {
	await fs.remove(persistDir);
}

/**
 * Searches for test query JSON files in the path.
 * @param path The path to the sample query JSON files.
 */
function readFileQueries(path: string): ITestQuery[] {
	// Note: This method *must* be synchronous for Mocha
	const fileNames = fs.readdirSync(`test/resources/queries/${path}`);

	const allQueries: ITestQuery[] = [];
	for (const fileName of fileNames) {
		const fileQuery = fs.readJSONSync(`test/resources/queries/${path}/${fileName}`);

		allQueries.push(fileQuery);
	}

	return allQueries;
}

export {getContentFromArchives, clearDisk, readFileQueries};
