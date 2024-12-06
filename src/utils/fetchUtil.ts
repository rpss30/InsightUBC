import http from "http";

// Generated with the help of Chat-GPT

export function fetchData(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		http.get(url, (response) => {
			let data = "";

			// A chunk of data has been received.
			response.on("data", (chunk) => {
				data += chunk;
			});

			// The whole response has been received.
			response.on("end", () => {
				resolve(data);
			});
		}).on("error", (error) => {
			reject(error);
		});
	});
}
