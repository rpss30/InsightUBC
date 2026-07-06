"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const TestUtil_1 = require("../TestUtil");
const PORT = 4321;
const SERVER_URL = `localhost:${PORT}`;
describe("Facade D3", function () {
    let server;
    let cpsczip;
    let campuszip;
    let pairzip;
    before(async function () {
        await (0, TestUtil_1.clearDisk)();
        server = new Server_1.default(PORT);
        cpsczip = await (0, TestUtil_1.getContentFromArchives)("cpsc.zip");
        campuszip = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        pairzip = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        await server.start();
    });
    after(async function () {
        await server.stop();
    });
    beforeEach(async function () {
        await (0, TestUtil_1.clearDisk)();
        const ZIP_FILE_DATA = Buffer.from(pairzip, "base64");
        const ENDPOINT_URL = "/dataset/sections/sections";
        const res = await (0, supertest_1.default)(SERVER_URL)
            .put(ENDPOINT_URL)
            .set("Content-Type", "application/x-zip-compressed")
            .send(ZIP_FILE_DATA);
        (0, chai_1.expect)(res.status).to.be.equal(200);
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
    it("GET health check", async function () {
        const res = await (0, supertest_1.default)(SERVER_URL).get("/health");
        (0, chai_1.expect)(res.status).to.be.equal(200);
        (0, chai_1.expect)(res.body).to.deep.equal({ result: { status: "ok" } });
    });
    it("PUT test for courses dataset", async function () {
        const ZIP_FILE_DATA = Buffer.from(cpsczip, "base64");
        const ENDPOINT_URL = "/dataset/cpsc/sections";
        const res = await (0, supertest_1.default)(SERVER_URL)
            .put(ENDPOINT_URL)
            .set("Content-Type", "application/x-zip-compressed")
            .send(ZIP_FILE_DATA);
        (0, chai_1.expect)(res.status).to.be.equal(200);
    });
    it("PUT test for rooms dataset", async function () {
        const ZIP_FILE_DATA = Buffer.from(campuszip, "base64");
        const ENDPOINT_URL = "/dataset/campus/rooms";
        const res = await (0, supertest_1.default)(SERVER_URL)
            .put(ENDPOINT_URL)
            .set("Content-Type", "application/x-zip-compressed")
            .send(ZIP_FILE_DATA);
        (0, chai_1.expect)(res.status).to.be.equal(200);
    });
    it("DELETE test for courses dataset", async function () {
        const ENDPOINT_URL = "/dataset/sections";
        const res = await (0, supertest_1.default)(SERVER_URL).delete(ENDPOINT_URL);
        (0, chai_1.expect)(res.status).to.be.equal(200);
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
        const res = await (0, supertest_1.default)(SERVER_URL)
            .post(ENDPOINT_URL)
            .send(QUERY);
        (0, chai_1.expect)(res.status).to.be.equal(200);
    });
    it("GET test for datasets", async function () {
        const ENDPOINT_URL = "/datasets";
        const res = await (0, supertest_1.default)(SERVER_URL).get(ENDPOINT_URL);
        (0, chai_1.expect)(res.status).to.be.equal(200);
    });
});
//# sourceMappingURL=Server.spec.js.map