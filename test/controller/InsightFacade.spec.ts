import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";


import chai, {assert, expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives, readFileQueries} from "../TestUtil";
import {fail} from "node:assert";
import {beforeEach} from "mocha";

chai.use(chaiAsPromised);

export interface ITestQuery {
	title: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let cpsc: string;
	let courses: string;
	let rooms: string;
	let emptyRooms: string;
	let invalidJson: string;
	let noSections: string;
	let emptySections: string;
	let cpscEmptySections: string;

	before(async function () {
		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
		courses = await getContentFromArchives("pair.zip");
		cpsc = await getContentFromArchives("cpsc.zip");
		// cpsc = courses;
		rooms = await getContentFromArchives("campus.zip");
		emptyRooms = await getContentFromArchives("campus-empty-rooms.zip");
		invalidJson = await getContentFromArchives("invalid-json.zip");
		noSections = await getContentFromArchives("no-sections-inside.zip");
		emptySections = await getContentFromArchives("empty-sections-inside.zip");
		cpscEmptySections = await getContentFromArchives("cpsc-with-empty-sections.zip");
	});


	describe("AddDataset", () => {
		beforeEach(async () => {
			await clearDisk();
			facade = new InsightFacade();
		});

		// SECTIONS TESTS

		it("Successfully add dataset",  async () => {
			const result = facade.addDataset("courses", courses, InsightDatasetKind.Sections);
			return expect(result).to.eventually.include.members(["courses"]);
		});

		it("Reject invalid JSON in dataset",  async () => {
			const result = facade.addDataset("invalid", invalidJson, InsightDatasetKind.Sections);
			return expect(result).to.eventually.include.members(["invalid"]);
		});

		it("Reject with an empty dataset id", async function () {
			const result = facade.addDataset("", cpsc, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject dataset with no sections", async function () {
			const result = facade.addDataset("noSections", noSections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject dataset with only empty sections", async function () {
			const result = facade.addDataset("emptySections", emptySections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject dataset with valid and empty sections", async function () {
			const result = facade.addDataset("validAndEmptySections", cpscEmptySections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.have.members(["validAndEmptySections"]);
		});

		it ("Reject with dataset id containing underscore", function() {
			const result = facade.addDataset("ubc_dataset", cpsc, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject with a whitespace dataset id", () => {
			const result = facade.addDataset(" ", cpsc, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("Reject dataset id with only tabs", function() {
			const result = facade.addDataset("  ", cpsc, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("Reject invalid kind on adding", function() {

			const invalidKind: string = "invalidValue";
			const result = facade.addDataset("ubc_dataset", cpsc, invalidKind as InsightDatasetKind);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject with an empty zip file", async () => {
			const emptyzip = await getContentFromArchives("empty.zip");
			const result = facade.addDataset("empty", emptyzip, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject with an invalid zip file", async () => {
			const fakezip = await getContentFromArchives("fake.zip");
			const result = facade.addDataset("fake", fakezip, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("Successfully add first dataset and reject second with same id", async function () {
			const result = await facade.addDataset("ubc", cpsc, InsightDatasetKind.Sections);
			const result2 = facade.addDataset("ubc", cpsc, InsightDatasetKind.Sections);


			return expect(result2).to.eventually.be.rejectedWith(InsightError);

		});

		it ("Successfully add two datasets with different IDs", async function () {
			this.timeout(6000);
			const result = await facade.addDataset("ubc", cpsc, InsightDatasetKind.Sections);
			const result2 =  facade.addDataset("courses", cpsc, InsightDatasetKind.Sections);


			return expect(result2).to.eventually.have.members(["ubc", "courses"]);
		});

		// ROOM TESTS

		it("Properly parse html file", async function () {
			this.timeout(60000);
			return facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms).then((result) => {
				expect(result).to.have.members(["rooms"]);
			});
		});

		it("Properly parse html file with empty rooms fields", async function () {
			this.timeout(60000);
			return facade.addDataset("empty-rooms-data", emptyRooms, InsightDatasetKind.Rooms).then((result) => {
				expect(result).to.have.members(["empty-rooms-data"]);
			});
		});
	});


	describe("removeDataset", () => {
		beforeEach(async () => {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("Successfully remove dataset", async () => {
			await facade.addDataset("cpsc", cpsc, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("cpsc");

			return expect(result).to.equal("cpsc");
		});

		it ("Successfully remove a dataset from different instance", async function () {
			await facade.addDataset("ubc", cpsc, InsightDatasetKind.Sections);
			const newInstance = new InsightFacade();

			return newInstance.removeDataset("ubc").then((result)  => {
				expect(result).to.equal("ubc");
			}).catch((err: string) => {
				assert.fail(`removeDataset threw unexpected error: ${err}`);
			});
		});

		it("Reject a dataset that has not been added", () => {
			const result = facade.removeDataset("cpsc");

			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("Reject due to empty dataset name", () => {
			const result = facade.removeDataset("");

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject due to whitespace dataset name", () => {
			const result = facade.removeDataset(" ");

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Reject due to underscore in dataset name", () => {
			const result = facade.removeDataset("cpsc_dataset");

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("listDatasets", () => {
		beforeEach(async () => {
			await clearDisk();
			facade = new InsightFacade();
		});

		let cpscSections: string;

		before(async function() {
			cpscSections = await getContentFromArchives("cpsc.zip");
		});

		it("Successfully return an empty array", () => {
			const result = facade.listDatasets();

			return expect(result).to.eventually.be.an("array").that.is.empty;
		});

		it("List one dataset", async function() {
			await facade.addDataset("sections", cpsc, InsightDatasetKind.Sections);

			// Execution
			const datasets = await facade.listDatasets();

			// Validation
			return expect(datasets).to.deep.equal([{
				id: "sections",
				kind: InsightDatasetKind.Sections,
				numRows: 1111
			}]);
		});

		it("List two datasets", async function() {

			await facade.addDataset("sections", cpsc, InsightDatasetKind.Sections);
			await facade.addDataset("ubc", cpsc, InsightDatasetKind.Sections);

			// Execution
			const datasets = await facade.listDatasets();

			// Validation
			expect(datasets).to.deep.equal([{
				id: "sections",
				kind: InsightDatasetKind.Sections,
				numRows: 1111
			}, {
				id: "ubc",
				kind: InsightDatasetKind.Sections,
				numRows: 1111
			}]);
		});

		it("List one dataset after adding two and removing one", async function() {

			await facade.addDataset("sections", cpsc, InsightDatasetKind.Sections);
			await facade.addDataset("cpsc", cpscSections, InsightDatasetKind.Sections);
			await facade.removeDataset("cpsc");

			// Execution
			const datasets = await facade.listDatasets();

			// Validation
			expect(datasets).to.deep.equal([{
				id: "sections",
				kind: InsightDatasetKind.Sections,
				numRows: 1111
			}]);
		});
	});

	describe("PerformQuery", function () {
		let full: string;

		before(async function () {
			this.timeout(60000);
			// Just in case there is anything hanging around from a previous run of the test suite
			await clearDisk();
			full = await getContentFromArchives("pair.zip");
			rooms = await getContentFromArchives("campus.zip");

			facade = new InsightFacade();
			await facade.addDataset("sections", full, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
		});

		// describe("simple queries",  function () {
		// 	let simpleQueries: ITestQuery[];
		// 	try {
		// 		simpleQueries = readFileQueries("simple");
		// 	} catch (e: unknown) {
		// 		expect.fail(`Failed to read one or more test queries. ${e}`);
		// 	}
		//
		// 	simpleQueries.forEach((test: any) => {
		// 		if (`${test.title}` === "NOT nested with AND") {
		// 			it(`${test.title}`, async () => {
		// 				return facade.performQuery(test.input).then((result) => {
		// 					expect(result).to.have.deep.members(test.expected);
		// 				}).catch((err) => {
		// 					if (test.expected === "InsightError") {
		// 						expect(err).to.be.instanceof(InsightError);
		// 					} else if (test.expected === "ResultTooLargeError") {
		// 						expect(err).to.be.instanceof(ResultTooLargeError);
		// 					} else {
		// 						fail(err);
		// 					}
		// 				});
		// 			});
		// 		}
		// 	});
		// });

		describe("valid queries", function() {
			let validQueries: ITestQuery[];
			try {
				validQueries = readFileQueries("valid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			validQueries.forEach((test: any) => {
				it(`${test.title}`, async () => {
					return facade.performQuery(test.input).then((result) => {
						expect(result).to.have.deep.members(test.expected);
					}).catch((err) => {
						if (test.expected === "InsightError") {
							expect(err).to.be.instanceof(InsightError);
						} else if (test.expected === "ResultTooLargeError") {
							expect(err).to.be.instanceof(ResultTooLargeError);
						} else {
							fail(err);
						}
					});
				});
			});
		});

		describe("invalid queries", function() {
			let invalidQueries: ITestQuery[];

			try {
				invalidQueries = readFileQueries("invalid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			invalidQueries.forEach((test: any) => {
				it(`${test.title}`, async () => {
					return facade.performQuery(test.input).then((result) => {
						expect(result).to.be.instanceof(test.expected);
					}).catch((err) => {
						if (test.expected === "InsightError") {
							expect(err).to.be.instanceof(InsightError);
						} else if (test.expected === "ResultTooLargeError") {
							expect(err).to.be.instanceof(ResultTooLargeError);
						} else {
							fail(err);
						}
					});
				});
			});
		});

		describe("valid room queries", function() {
			let invalidQueries: ITestQuery[];

			try {
				invalidQueries = readFileQueries("validRoom");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			invalidQueries.forEach((test: any) => {
				it(`${test.title}`, async () => {
					return facade.performQuery(test.input).then((result) => {
						expect(result).to.have.deep.members(test.expected);
					}).catch((err) => {
						if (test.expected === "InsightError") {
							expect(err).to.be.instanceof(InsightError);
						} else if (test.expected === "ResultTooLargeError") {
							expect(err).to.be.instanceof(ResultTooLargeError);
						} else {
							fail(err);
						}
					});
				});
			});
		});

		describe("invalid room queries", function() {
			let invalidQueries: ITestQuery[];

			try {
				invalidQueries = readFileQueries("invalidRoom");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			invalidQueries.forEach((test: any) => {
				it(`${test.title}`, async () => {
					return facade.performQuery(test.input).then((result) => {
						expect(result).to.be.instanceof(test.expected);
					}).catch((err) => {
						if (test.expected === "InsightError") {
							expect(err).to.be.instanceof(InsightError);
						} else if (test.expected === "ResultTooLargeError") {
							expect(err).to.be.instanceof(ResultTooLargeError);
						} else {
							fail(err);
						}
					});
				});
			});
		});
	});
});
