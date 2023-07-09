import { Response, Handler } from "express";
import { validationResult } from "express-validator";

export const createErrorHandler = (statusCode : number, message : string) => (res : Response) => {
    res.status(statusCode).send({ "error" : message });
}


export const rejectHandlers = {
    sessionNotFound : createErrorHandler(400, "session-not-found"),
    invalidRequest : createErrorHandler(400, "invalid-request"),
    databaseError : createErrorHandler(500, "database-error"),
}


export const validationErrorHandler : Handler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ "error" : "validation-error" });
        return;
    }
    next();
}
