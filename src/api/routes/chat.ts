import { Router, Request, Handler } from 'express';
import { generateId } from '../../utils/id';
import { ChatSessionManager } from '../../chat-session/ChatSessionManager';
import { IChatSessionParameters } from '../../chat-session/ChatSession';
import {  } from 'express';
import { DatabaseClient } from '../../database/DatabaseClient';
import Debug from '../../utils/Debug';
import { query } from 'express-validator';
import { validationErrorHandler } from '../handlers/error-handler';
import { check, validationResult } from 'express-validator';
import { authenticateJWT } from '../middleware/jwt';
import { RequestWithUser } from '../middleware/jwt';
import { ChatSession } from '../../chat-session/ChatSession';
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
  } from "langchain/prompts";
import { WOAH_SYSTEM_MESSAGE } from '../../definitions';

const router = Router();

const chatbotParameters : IChatSessionParameters = {
    temperature: 1.0,
    modelName: "gpt-3.5-turbo",
    maxIterations: 20,
    prompt : ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(WOAH_SYSTEM_MESSAGE),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
    ])
}

const SESSION_MANAGER = new ChatSessionManager({
    chatbotParameters,
    envAPIKey : "WOAHVERSE_OPENAI_API_KEY",
    monitorInterval : 1000 * 60 * 10 // 10 minutes
});


/**
 * Ensures the client's request for a chat session exists, and that the client is authorized to access it.
 */
const existsAndAuthorized : Handler = async (req, res, next) => {
    if (!ChatSession.existsInDatabase(req.query.sessionId as string)) {
        return res.status(400).send({ "error" : "session-not-found" });
    }
    if (!ChatSession.verifyOwnership(req.query.sessionId as string, (req as RequestWithUser).user.address)) {
        return res.status(401).send({ "error" : "unauthorized" });
    }
    next();
}


const handleNewSession : Handler = async (req, res, next) => {
    try {
        // create a session with the user wallet address 
        const session = await SESSION_MANAGER.createSession((req as RequestWithUser).user.address);
        res.send({ sessionId : session.id });
        
    } catch (e) {
        // will throw an error if it can't insert into database
        Debug.logError(e);
        res.status(500).send({ "error" : JSON.stringify(e) });
    }
}

const handleMessage : Handler = async (req, res) => {

    // const insertRes = await DatabaseClient.Instance.query(
    //     `INSERT INTO messages (id, conversation_id, message) VALUES ($1, $2, $3)`, 
    //     [generateId(12), req.query.sessionId, req.query.message]
    // );

    // if (!insertRes) {
    //     res.status(500).send({ "error" : "database-error" });
    //     return;
    // }





    // here we must authenticate with bearer token
    // to make sure requester is owner of session
    const sessionId = req.query.sessionId; // <- INSTEAD OF THIS USE THE JWT BEARER TOKEN
    const message = req.query.message;

    // if (!SESSION_MANAGER.hasActiveSession(sessionId as string)) return sessionNotFound(res);
    // const session = SESSION_MANAGER.getSession(sessionId as string);
    // if (!session) return sessionNotFound(res);

    session.streamResponseToClient(message as string, res);
}


const handleSesssionHistory : Handler = async (req, res) => {

    const sessionId = req.query.sessionId;

    if (!ChatSession.existsInDatabase(sessionId as string)) {
        return res.status(404).send({ "error" : "session-not-found" });
    }

    if (!ChatSession.verifyOwnership(sessionId as string, (req as RequestWithUser).user.address)) {
            return res.status(401).send({ "error" : "unauthorized" });
    }

    const session = SESSION_MANAGER.getSession(sessionId as string);
    if (!session) {
        return res.status(400).send({ "error" : "session-not-found" });
    }

    const history = await DatabaseClient.Instance.queryRows(
        `SELECT * FROM messages WHERE conversation_id = $1`,
        [sessionId]
    );

    if (!history) {
        return res.status(404).send({ "error" : "No conversation history found" });
    }

    res.send(history);
}



export default (parent : Router) => {

    parent.use("/chat", router);

    router.get("/new-session", 
        authenticateJWT, 
        handleNewSession
    );

    router.get("/session-history", 
        authenticateJWT, 
        check('sessionId')
            .exists().not().isEmpty().withMessage("sessionId is required")
            .escape(),
        validationErrorHandler,
        existsAndAuthorized,
        handleSesssionHistory
    );

    // check('sessionId').custom(() => {})
    // Use express validator to make sure everything checks out
    // also check if there is a JWT bearer token
    router.get("/message",
        authenticateJWT,
        check('sessionId')
            .exists().not().isEmpty().withMessage("sessionId is required")
            .escape(),
        check('message')
            .exists().not().isEmpty().withMessage("message is required")
            .trim().escape(),
        validationErrorHandler,
        existsAndAuthorized,
        handleMessage
    );

    // router.get("/active-sessions", async (req, res) => {
    //     res.send(JSON.stringify(SESSION.getAllActiveSessions()));
    // });

}