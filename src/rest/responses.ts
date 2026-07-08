import {Response} from "express";
import {InsightError, NotFoundError, ResultTooLargeError} from "../controller/IInsightFacade";

type ErrorPayload = {
	error: string;
	code: string;
};

type ResultPayload<T> = {
	result: T;
};

export function sendResult<T>(res: Response, result: T, status = 200): void {
	res.status(status).json({result} satisfies ResultPayload<T>);
}

export function sendDatasetResult<T>(res: Response, result: T): void {
	res.set("HX-Trigger", "refreshDatasets");
	sendResult(res, result);
}

export function sendFacadeError(res: Response, error: unknown, fallbackMessage: string): void {
	const payload = toErrorPayload(error, fallbackMessage);
	res.status(payload.status).json(payload.body);
}

function toErrorPayload(error: unknown, fallbackMessage: string): {status: number; body: ErrorPayload} {
	if (error instanceof NotFoundError) {
		return {
			status: 404,
			body: {
				code: "NOT_FOUND",
				error: error.message || fallbackMessage,
			},
		};
	}

	if (error instanceof ResultTooLargeError) {
		return {
			status: 400,
			body: {
				code: "RESULT_TOO_LARGE",
				error: error.message || fallbackMessage,
			},
		};
	}

	if (error instanceof InsightError) {
		return {
			status: 400,
			body: {
				code: "INSIGHT_ERROR",
				error: error.message || fallbackMessage,
			},
		};
	}

	if (error instanceof Error) {
		return {
			status: 500,
			body: {
				code: "INTERNAL_ERROR",
				error: error.message || fallbackMessage,
			},
		};
	}

	return {
		status: 500,
		body: {
			code: "INTERNAL_ERROR",
			error: fallbackMessage,
		},
	};
}
