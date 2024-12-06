"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const Server_1 = __importDefault(require("./rest/Server"));
class App {
    initServer(port) {
        console.info(`App::initServer( ${port} ) - start`);
        const server = new Server_1.default(port);
        return server.start().then(() => {
            console.info("App::initServer() - started");
        }).catch((err) => {
            console.error(`App::initServer() - ERROR: ${err.message}`);
        });
    }
}
exports.App = App;
console.info("App - starting");
const app = new App();
(async () => {
    await app.initServer(4321);
})();
//# sourceMappingURL=App.js.map