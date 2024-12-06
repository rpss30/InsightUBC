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
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const TestUtil_1 = require("../TestUtil");
const node_assert_1 = require("node:assert");
const mocha_1 = require("mocha");
chai_1.default.use(chai_as_promised_1.default);
describe("InsightFacade", function () {
    let facade;
    let cpsc;
    let courses;
    let rooms;
    let emptyRooms;
    let invalidJson;
    let noSections;
    let emptySections;
    let cpscEmptySections;
    before(async function () {
        await (0, TestUtil_1.clearDisk)();
        courses = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        cpsc = await (0, TestUtil_1.getContentFromArchives)("cpsc.zip");
        rooms = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        emptyRooms = await (0, TestUtil_1.getContentFromArchives)("campus-empty-rooms.zip");
        invalidJson = await (0, TestUtil_1.getContentFromArchives)("invalid-json.zip");
        noSections = await (0, TestUtil_1.getContentFromArchives)("no-sections-inside.zip");
        emptySections = await (0, TestUtil_1.getContentFromArchives)("empty-sections-inside.zip");
        cpscEmptySections = await (0, TestUtil_1.getContentFromArchives)("cpsc-with-empty-sections.zip");
    });
    describe("AddDataset", () => {
        (0, mocha_1.beforeEach)(async () => {
            await (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("Successfully add dataset", async () => {
            const result = facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.include.members(["courses"]);
        });
        it("Reject invalid JSON in dataset", async () => {
            const result = facade.addDataset("invalid", invalidJson, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.include.members(["invalid"]);
        });
        it("Reject with an empty dataset id", async function () {
            const result = facade.addDataset("", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject dataset with no sections", async function () {
            const result = facade.addDataset("noSections", noSections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject dataset with only empty sections", async function () {
            const result = facade.addDataset("emptySections", emptySections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject dataset with valid and empty sections", async function () {
            const result = facade.addDataset("validAndEmptySections", cpscEmptySections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["validAndEmptySections"]);
        });
        it("Reject with dataset id containing underscore", function () {
            const result = facade.addDataset("ubc_dataset", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject with a whitespace dataset id", () => {
            const result = facade.addDataset(" ", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject dataset id with only tabs", function () {
            const result = facade.addDataset("  ", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject invalid kind on adding", function () {
            const invalidKind = "invalidValue";
            const result = facade.addDataset("ubc_dataset", cpsc, invalidKind);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject with an empty zip file", async () => {
            const emptyzip = await (0, TestUtil_1.getContentFromArchives)("empty.zip");
            const result = facade.addDataset("empty", emptyzip, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject with an invalid zip file", async () => {
            const fakezip = await (0, TestUtil_1.getContentFromArchives)("fake.zip");
            const result = facade.addDataset("fake", fakezip, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Successfully add first dataset and reject second with same id", async function () {
            const result = await facade.addDataset("ubc", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            const result2 = facade.addDataset("ubc", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result2).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Successfully add two datasets with different IDs", async function () {
            this.timeout(6000);
            const result = await facade.addDataset("ubc", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            const result2 = facade.addDataset("courses", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result2).to.eventually.have.members(["ubc", "courses"]);
        });
        it("Properly parse html file", async function () {
            this.timeout(60000);
            return facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms).then((result) => {
                (0, chai_1.expect)(result).to.have.members(["rooms"]);
            });
        });
        it("Properly parse html file with empty rooms fields", async function () {
            this.timeout(60000);
            return facade.addDataset("empty-rooms-data", emptyRooms, IInsightFacade_1.InsightDatasetKind.Rooms).then((result) => {
                (0, chai_1.expect)(result).to.have.members(["empty-rooms-data"]);
            });
        });
    });
    describe("removeDataset", () => {
        (0, mocha_1.beforeEach)(async () => {
            await (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("Successfully remove dataset", async () => {
            await facade.addDataset("cpsc", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.removeDataset("cpsc");
            return (0, chai_1.expect)(result).to.equal("cpsc");
        });
        it("Successfully remove a dataset from different instance", async function () {
            await facade.addDataset("ubc", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            const newInstance = new InsightFacade_1.default();
            return newInstance.removeDataset("ubc").then((result) => {
                (0, chai_1.expect)(result).to.equal("ubc");
            }).catch((err) => {
                chai_1.assert.fail(`removeDataset threw unexpected error: ${err}`);
            });
        });
        it("Reject a dataset that has not been added", () => {
            const result = facade.removeDataset("cpsc");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
        });
        it("Reject due to empty dataset name", () => {
            const result = facade.removeDataset("");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject due to whitespace dataset name", () => {
            const result = facade.removeDataset(" ");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("Reject due to underscore in dataset name", () => {
            const result = facade.removeDataset("cpsc_dataset");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    describe("listDatasets", () => {
        (0, mocha_1.beforeEach)(async () => {
            await (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        let cpscSections;
        before(async function () {
            cpscSections = await (0, TestUtil_1.getContentFromArchives)("cpsc.zip");
        });
        it("Successfully return an empty array", () => {
            const result = facade.listDatasets();
            return (0, chai_1.expect)(result).to.eventually.be.an("array").that.is.empty;
        });
        it("List one dataset", async function () {
            await facade.addDataset("sections", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            const datasets = await facade.listDatasets();
            return (0, chai_1.expect)(datasets).to.deep.equal([{
                    id: "sections",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                }]);
        });
        it("List two datasets", async function () {
            await facade.addDataset("sections", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("ubc", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets).to.deep.equal([{
                    id: "sections",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                }, {
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                }]);
        });
        it("List one dataset after adding two and removing one", async function () {
            await facade.addDataset("sections", cpsc, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("cpsc", cpscSections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("cpsc");
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets).to.deep.equal([{
                    id: "sections",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                }]);
        });
    });
    describe("PerformQuery", function () {
        let full;
        before(async function () {
            this.timeout(60000);
            await (0, TestUtil_1.clearDisk)();
            full = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
            rooms = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
            facade = new InsightFacade_1.default();
            await facade.addDataset("sections", full, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
        });
        describe("valid queries", function () {
            let validQueries;
            try {
                validQueries = (0, TestUtil_1.readFileQueries)("valid");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            validQueries.forEach((test) => {
                it(`${test.title}`, async () => {
                    return facade.performQuery(test.input).then((result) => {
                        (0, chai_1.expect)(result).to.have.deep.members(test.expected);
                    }).catch((err) => {
                        if (test.expected === "InsightError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.InsightError);
                        }
                        else if (test.expected === "ResultTooLargeError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
                        }
                        else {
                            (0, node_assert_1.fail)(err);
                        }
                    });
                });
            });
        });
        describe("invalid queries", function () {
            let invalidQueries;
            try {
                invalidQueries = (0, TestUtil_1.readFileQueries)("invalid");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            invalidQueries.forEach((test) => {
                it(`${test.title}`, async () => {
                    return facade.performQuery(test.input).then((result) => {
                        (0, chai_1.expect)(result).to.be.instanceof(test.expected);
                    }).catch((err) => {
                        if (test.expected === "InsightError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.InsightError);
                        }
                        else if (test.expected === "ResultTooLargeError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
                        }
                        else {
                            (0, node_assert_1.fail)(err);
                        }
                    });
                });
            });
        });
        describe("valid room queries", function () {
            let invalidQueries;
            try {
                invalidQueries = (0, TestUtil_1.readFileQueries)("validRoom");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            invalidQueries.forEach((test) => {
                it(`${test.title}`, async () => {
                    return facade.performQuery(test.input).then((result) => {
                        (0, chai_1.expect)(result).to.have.deep.members(test.expected);
                    }).catch((err) => {
                        if (test.expected === "InsightError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.InsightError);
                        }
                        else if (test.expected === "ResultTooLargeError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
                        }
                        else {
                            (0, node_assert_1.fail)(err);
                        }
                    });
                });
            });
        });
        describe("invalid room queries", function () {
            let invalidQueries;
            try {
                invalidQueries = (0, TestUtil_1.readFileQueries)("invalidRoom");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            invalidQueries.forEach((test) => {
                it(`${test.title}`, async () => {
                    return facade.performQuery(test.input).then((result) => {
                        (0, chai_1.expect)(result).to.be.instanceof(test.expected);
                    }).catch((err) => {
                        if (test.expected === "InsightError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.InsightError);
                        }
                        else if (test.expected === "ResultTooLargeError") {
                            (0, chai_1.expect)(err).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
                        }
                        else {
                            (0, node_assert_1.fail)(err);
                        }
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map