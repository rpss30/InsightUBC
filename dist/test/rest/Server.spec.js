"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const TestUtil_1 = require("../TestUtil");
const PORT = 4321;
const SERVER_URL = `localhost:${PORT}`;
describe("Facade D3", function () {
    let facade;
    let server;
    let cpsczip;
    let campuszip;
    let pairzip;
    before(async function () {
        await (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
        server = new Server_1.default(PORT);
        cpsczip = await (0, TestUtil_1.getContentFromArchives)("cpsc.zip");
        campuszip = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        pairzip = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        server.start().then(() => {
            console.log("success");
        }).catch(() => {
            console.log("error");
        });
    });
    after(async function () {
        server.stop().then(() => {
            console.log("success");
        }).catch(() => {
            console.log("error");
        });
    });
    beforeEach(async function () {
        await (0, TestUtil_1.clearDisk)();
        const ZIP_FILE_DATA = Buffer.from(pairzip, "base64");
        const ENDPOINT_URL = "/dataset/sections/sections";
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .set("Content-Type", "application/x-zip-compressed")
                .send(ZIP_FILE_DATA)
                .then(function (res) {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                console.error(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    afterEach(async function () {
        await (0, supertest_1.default)(SERVER_URL)
            .delete("/dataset/sections")
            .then(() => {
        })
            .catch((error) => {
            console.error("Cleanup error ignored:", error.message);
        });
    });
    it("PUT test for courses dataset", async function () {
        const ZIP_FILE_DATA = Buffer.from(cpsczip, "base64");
        const ENDPOINT_URL = "/dataset/cpsc/sections";
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .set("Content-Type", "application/x-zip-compressed")
                .send(ZIP_FILE_DATA)
                .then(function (res) {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                console.error(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    it("PUT test for rooms dataset", async function () {
        const ZIP_FILE_DATA = Buffer.from(campuszip, "base64");
        const ENDPOINT_URL = "/dataset/campus/rooms";
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .set("Content-Type", "application/x-zip-compressed")
                .send(ZIP_FILE_DATA)
                .then(function (res) {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                console.error(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    it("DELETE test for courses dataset", async function () {
        const ENDPOINT_URL = "/dataset/sections";
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .delete(ENDPOINT_URL)
                .then(function (res) {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            });
        }
        catch (err) {
            console.error(err);
            chai_1.expect.fail();
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
            return (0, supertest_1.default)(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(QUERY)
                .then(function (res) {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            });
        }
        catch (err) {
            console.error(err);
            chai_1.expect.fail();
        }
    });
    it("GET test for datasets", async function () {
        const ENDPOINT_URL = "/datasets";
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res) {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            });
        }
        catch (err) {
            console.error(err);
            chai_1.expect.fail();
        }
    });
});
//# sourceMappingURL=Server.spec.js.map