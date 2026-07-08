"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFacadeError = exports.sendDatasetResult = exports.sendResult = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
function sendResult(res, result, status = 200) {
    res.status(status).json({ result });
}
exports.sendResult = sendResult;
function sendDatasetResult(res, result) {
    res.set("HX-Trigger", "refreshDatasets");
    sendResult(res, result);
}
exports.sendDatasetResult = sendDatasetResult;
function sendFacadeError(res, error, fallbackMessage) {
    const payload = toErrorPayload(error, fallbackMessage);
    res.status(payload.status).json(payload.body);
}
exports.sendFacadeError = sendFacadeError;
function toErrorPayload(error, fallbackMessage) {
    if (error instanceof IInsightFacade_1.NotFoundError) {
        return {
            status: 404,
            body: {
                code: "NOT_FOUND",
                error: error.message || fallbackMessage,
            },
        };
    }
    if (error instanceof IInsightFacade_1.ResultTooLargeError) {
        return {
            status: 400,
            body: {
                code: "RESULT_TOO_LARGE",
                error: error.message || fallbackMessage,
            },
        };
    }
    if (error instanceof IInsightFacade_1.InsightError) {
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
//# sourceMappingURL=responses.js.map