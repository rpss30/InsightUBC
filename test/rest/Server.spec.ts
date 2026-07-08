import Server from "../../src/rest/Server";

import {expect} from "chai";
import request from "supertest";
import {clearDisk, getContentFromArchives} from "../TestUtil";

const PORT = 4321;
const SERVER_URL = `localhost:${PORT}`;

describe("Facade D3", function () {

	let server: Server;
	let cpsczip: string;
	let campuszip: string;
	let pairzip: string;

	before(async function () {
		await clearDisk();
		server = new Server(PORT);
		cpsczip = await getContentFromArchives("cpsc.zip");
		campuszip = await getContentFromArchives("campus.zip");
		pairzip = await getContentFromArchives("pair.zip");
		await server.start();
	});

	after(async function () {
		await server.stop();
	});

	beforeEach(async function () {
		await clearDisk();
		const ZIP_FILE_DATA = Buffer.from(pairzip, "base64");
		const ENDPOINT_URL = "/dataset/sections/sections";
		const res = await request(SERVER_URL)
			.put(ENDPOINT_URL)
			.set("Content-Type", "application/x-zip-compressed")
			.send(ZIP_FILE_DATA);

		expect(res.status).to.be.equal(200);
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

	it("GET health check", async function () {
		const res = await request(SERVER_URL).get("/health");

		expect(res.status).to.be.equal(200);
		expect(res.body).to.deep.equal({result: {status: "ok"}});
	});

	it("PUT test for courses dataset", async function () {
		const ZIP_FILE_DATA = Buffer.from(cpsczip, "base64");
		const ENDPOINT_URL = "/dataset/cpsc/sections";
		const res = await request(SERVER_URL)
			.put(ENDPOINT_URL)
			.set("Content-Type", "application/x-zip-compressed")
			.send(ZIP_FILE_DATA);

		expect(res.status).to.be.equal(200);
	});

	it("PUT rejects duplicate dataset ids with a stable error payload", async function () {
		const ZIP_FILE_DATA = Buffer.from(pairzip, "base64");
		const res = await request(SERVER_URL)
			.put("/dataset/sections/sections")
			.set("Content-Type", "application/x-zip-compressed")
			.send(ZIP_FILE_DATA);

		expect(res.status).to.be.equal(400);
		expect(res.body).to.include({code: "INSIGHT_ERROR"});
		expect(res.body.error).to.contain("already been added");
	});

	it("PUT rejects invalid dataset ids with a stable error payload", async function () {
		const ZIP_FILE_DATA = Buffer.from(cpsczip, "base64");
		const res = await request(SERVER_URL)
			.put("/dataset/bad_id/sections")
			.set("Content-Type", "application/x-zip-compressed")
			.send(ZIP_FILE_DATA);

		expect(res.status).to.be.equal(400);
		expect(res.body).to.deep.equal({code: "INSIGHT_ERROR", error: "Invalid ID"});
	});

	it("PUT rejects invalid dataset kinds with a stable error payload", async function () {
		const ZIP_FILE_DATA = Buffer.from(cpsczip, "base64");
		const res = await request(SERVER_URL)
			.put("/dataset/badkind/invalid")
			.set("Content-Type", "application/x-zip-compressed")
			.send(ZIP_FILE_DATA);

		expect(res.status).to.be.equal(400);
		expect(res.body).to.deep.equal({code: "INSIGHT_ERROR", error: "Invalid Dataset Kind"});
	});

	it("PUT test for rooms dataset", async function () {
		const ZIP_FILE_DATA = Buffer.from(campuszip, "base64");
		const ENDPOINT_URL = "/dataset/campus/rooms";
		const res = await request(SERVER_URL)
			.put(ENDPOINT_URL)
			.set("Content-Type", "application/x-zip-compressed")
			.send(ZIP_FILE_DATA);

		expect(res.status).to.be.equal(200);
	});

	it("DELETE test for courses dataset", async function () {
		const ENDPOINT_URL = "/dataset/sections";
		const res = await request(SERVER_URL).delete(ENDPOINT_URL);

		expect(res.status).to.be.equal(200);
	});

	it("DELETE returns 404 for missing datasets", async function () {
		const res = await request(SERVER_URL).delete("/dataset/missing");

		expect(res.status).to.be.equal(404);
		expect(res.body).to.deep.equal({code: "NOT_FOUND", error: "This dataset does not exist."});
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
		const res = await request(SERVER_URL)
			.post(ENDPOINT_URL)
			.send(QUERY);

		expect(res.status).to.be.equal(200);
	});

	it("POST returns a stable error payload for invalid queries", async function () {
		const res = await request(SERVER_URL)
			.post("/query")
			.send({});

		expect(res.status).to.be.equal(400);
		expect(res.body).to.deep.equal({
			code: "INSIGHT_ERROR",
			error: "Syntax Error: Unable to parse query",
		});
	});

	it("POST returns a stable error payload for oversized results", async function () {
		const res = await request(SERVER_URL)
			.post("/query")
			.send({
				WHERE: {},
				OPTIONS: {
					COLUMNS: ["sections_dept"],
				},
			});

		expect(res.status).to.be.equal(400);
		expect(res.body).to.deep.equal({
			code: "RESULT_TOO_LARGE",
			error: "Result set contains more than 5000 records.",
		});
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
		const res = await request(SERVER_URL).get(ENDPOINT_URL);

		expect(res.status).to.be.equal(200);
		expect(res.body.result).to.deep.equal([{
			id: "sections",
			kind: "sections",
			numRows: 64612,
		}]);
	});
});
