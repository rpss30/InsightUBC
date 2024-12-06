import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import {clearDisk, getContentFromArchives, readFileQueries} from "../TestUtil";
// import {InsightError, ResultTooLargeError} from "../../src/controller/IInsightFacade";
import {fail} from "node:assert";
import {ITestQuery} from "../controller/InsightFacade.spec";

const PORT = 4321;
const SERVER_URL = `localhost:${PORT}`;

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	let cpsczip: string;
	let campuszip: string;
	let pairzip: string;

	before(async function () {
		await clearDisk();
		facade = new InsightFacade();
		server = new Server(PORT);
		cpsczip = await getContentFromArchives("cpsc.zip");
		campuszip = await getContentFromArchives("campus.zip");
		pairzip = await getContentFromArchives("pair.zip");
		// TODO: start server here once and handle errors properly
		// await server.start();
		server.start().then(() => {
			console.log("success");
		}).catch(() => {
			console.log("error");
		});
	});

	after(async function () {
		// await server.stop();
		server.stop().then(() => {
			console.log("success");
		}).catch(() => {
			console.log("error");
		});
	});

	beforeEach(async function () {
		await clearDisk();
		const ZIP_FILE_DATA = Buffer.from(pairzip, "base64");
		const ENDPOINT_URL = "/dataset/sections/sections";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.set("Content-Type", "application/x-zip-compressed")
				.send(ZIP_FILE_DATA)
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.error(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	afterEach(async function() {
		// might want to add some process logging here to keep track of what is going on
		await request(SERVER_URL)
			.delete("/dataset/sections")
			.then(() => {
				// Successfully cleaned up, no action needed
			})
			.catch((error) => {
				// Ignoring cleanup errors intentionally
				console.error("Cleanup error ignored:", error.message);
			});
	});

	// Sample on how to format PUT requests
	it("PUT test for courses dataset", async function () {
		// const ZIP_FILE_DATA = atob(cpsczip);
		const ZIP_FILE_DATA = Buffer.from(cpsczip, "base64");
		const ENDPOINT_URL = "/dataset/cpsc/sections";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.set("Content-Type", "application/x-zip-compressed")
				.send(ZIP_FILE_DATA)
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.error(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("PUT test for rooms dataset", async function () {
		// const ZIP_FILE_DATA = atob(campuszip);
		const ZIP_FILE_DATA = Buffer.from(campuszip, "base64");
		const ENDPOINT_URL = "/dataset/campus/rooms";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.set("Content-Type", "application/x-zip-compressed")
				.send(ZIP_FILE_DATA)
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.error(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("DELETE test for courses dataset", async function () {
		const ENDPOINT_URL = "/dataset/sections";
		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					expect(res.status).to.be.equal(200);
				});
		} catch (err) {
			console.error(err);
			expect.fail();
		}
	});

	it("POST test for query", async function () {
		const ENDPOINT_URL = "/query";
		const QUERY = {
			WHERE: {
				OR: [
					{
						LT: {
							sections_avg: 50
						}
					},
					{
						GT: {
							sections_avg: 95
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_avg",
					"sections_year"
				]
			}
		};
		try {
			return request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(QUERY)
				.then(function (res: Response) {
					expect(res.status).to.be.equal(200);
					// expect(res.body).to.be.an("object"); // Further assertions can be made based on the expected structure of the response
				});
		} catch (err) {
			console.error(err);
			expect.fail();
		}
	});

	// describe("Bulk queries", function() {
	// 	let validQueries: ITestQuery[];
	// 	try {
	// 		validQueries = readFileQueries("valid");
	// 	} catch (e: unknown) {
	// 		expect.fail(`Failed to read one or more test queries. ${e}`);
	// 	}
	//
	// 	validQueries.forEach((test: any) => {
	// 		if (`${test.title}` !== "MinMaxRoomSeatsShouldBeEqual" &&
	// 			`${test.title}` !== "SortByMaxLatForRoomNumber") {
	// 			it(`${test.title}`, async () => {
	// 				const ENDPOINT_URL = "/query";
	// 				const QUERY = test.input;
	// 				try {
	// 					return request(SERVER_URL)
	// 						.post(ENDPOINT_URL)
	// 						.send(QUERY)
	// 						.then(function (res: Response) {
	// 							expect(res.status).to.be.equal(200);
	// 							// expect(res.body).to.be.an("object"); // Further assertions can be made based on the expected structure of the response
	// 						});
	// 				} catch (err) {
	// 					console.error(err);
	// 					expect.fail();
	// 				}
	// 			});
	// 		}
	// 	});
	// });

	it("GET test for datasets", async function () {
		const ENDPOINT_URL = "/datasets";
		try {
			return request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: Response) {
					expect(res.status).to.be.equal(200);
					// expect(res.body).to.be.an("array"); // Assuming the response is an array of dataset objects
					// Further assertions can be made based on the content of the datasets returned
				});
		} catch (err) {
			console.error(err);
			expect.fail();
		}
	});
});
