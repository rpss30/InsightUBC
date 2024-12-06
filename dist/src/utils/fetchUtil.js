"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchData = void 0;
const http_1 = __importDefault(require("http"));
function fetchData(url) {
    return new Promise((resolve, reject) => {
        http_1.default.get(url, (response) => {
            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                resolve(data);
            });
        }).on("error", (error) => {
            reject(error);
        });
    });
}
exports.fetchData = fetchData;
//# sourceMappingURL=fetchUtil.js.map