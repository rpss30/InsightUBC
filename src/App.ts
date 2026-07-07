import Server from "./rest/Server";

const DEFAULT_PORT = 4321;

/**
 * Main app class that is run with the node command. Starts the server.
 */
export class App {
	public initServer(port: number) {
		console.info(`App::initServer( ${port} ) - start`);

		const server = new Server(port);
		return server.start().then(() => {
			console.info("App::initServer() - started");
		}).catch((err: Error) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
	}
}

function getPort(): number {
	const port = Number.parseInt(process.env.PORT ?? "", 10);
	return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
}

console.info("App - starting");
const app = new App();
(async () => {
	await app.initServer(getPort());
})();
