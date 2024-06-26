import { Router, Request, Response, Handler } from 'express';
import { ChatSessionManager } from '../../chat/ChatSessionManager';
import { IChatSessionParameters } from '../../chat/ChatSession';
import Debug from '../../utils/Debug';
import { validationErrorHandler } from '../handlers/error-handler';
import { check } from 'express-validator';
import { authenticateJWT, authenticateJWTWithCookies } from '../middleware/jwt';
import { RequestWithUser } from '../middleware/jwt';
import { ChatSession } from '../../chat/ChatSession';
import { CHAT_SESSION_PARAMETERS } from '../../chat/chat-behavior';

const router = Router();

const SESSION_MANAGER = new ChatSessionManager({
    chatbotParameters : CHAT_SESSION_PARAMETERS,
    envAPIKey : "WOAHVERSE_OPENAI_API_KEY",
    monitorInterval : 1000 * 60 * 10 // 10 minutes
});


const sendHistory = async (req : Request, res : Response, offset? : number) => {
    const session = await SESSION_MANAGER.getSession(req.query.sessionId as string); 
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await session.getMessageHistory(limit, offset);
    res.send({ history });    
}

/**
 * Ensures the client's request for a chat session exists, and that the client is authorized to access it.
 */
const sessionExistsAndAuthorized : Handler = async (req, res, next) => {
    let sessionId = req.query.sessionId as string || req.body.sessionId as string; // could come from either a post or get 
    const existsAndOwns = await ChatSession.verifyOwnership(sessionId, (req as RequestWithUser).user.address);
    if (!existsAndOwns) {
        res.status(401).send({ "error" : "Session does not exist or belong to user" });
        return;
    }
    next();
}


/**
 * Creates a new chat session with the client wallet address, and returns the session id
 */
const handleNewSession : Handler = async (req, res) => {
    try {
        // before this can succesfully happen, we need to eth verify that the wallet address
        // is an owner of the NFT
        const session = await SESSION_MANAGER.newSession((req as RequestWithUser).user.address);
        res.send({ sessionId : session.id });
    } catch (e) {
        Debug.error(e);
        res.status(500).send({ "error" : JSON.stringify(e) });
    }
}

/**
 * Sends a message to the chat session
 */
const handleMessage : Handler = async (req, res) => {
    try {
        const session = await SESSION_MANAGER.getSession(req.body.sessionId as string);
        session.streamResponseToClient(req.body.message as string, res);
    } catch (e) {
        Debug.error(e);
        res.status(500).send({ "error" : `Failed to get session ${req.query.sessionId}` });
    }
}

/**
 * Returns the chat session's message history
 */
const handleSesssionHistory : Handler = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset as string) || 0;
        sendHistory(req, res, offset);
    } catch (e) {
        Debug.error(e);
        res.status(500).send({ "error" : `Failed to get session ${req.query.sessionId}` });
    }
}


const handleLoadSession : Handler = async (req, res, next) => {
    try {
        sendHistory(req, res);
    } catch (e) {
        Debug.error(e);
        res.status(500).send({ "error" : `Failed to get session ${req.query.sessionId}` });
    }
}

const handleListSessions : Handler = async (req, res, next) => {
    try {
        const sessions = await ChatSession.listSessions((req as RequestWithUser).user.address);
        res.send({ sessions });
    } catch (e) {
        Debug.error(e);
        res.status(500).send({ "error" : `Failed to get session ${req.query.sessionId}` });
    }
}
        


export default (parent : Router) => {

    parent.use("/chat", router);

    router.get("/new-session", 
        authenticateJWTWithCookies, 
        handleNewSession
    );

    // loads the session, and returns the history
    router.get("/load-session",
        authenticateJWTWithCookies,
        check('sessionId')
            .exists().not().isEmpty().withMessage("sessionId is required")
            .escape(),
        check('limit') // optional but must be numeric
            .optional()
            .isNumeric().withMessage("limit must be numeric"),
        validationErrorHandler,
        sessionExistsAndAuthorized,
        handleLoadSession
    );

    router.get("/session-history", 
        authenticateJWTWithCookies, 
        check('sessionId')
            .exists().not().isEmpty().withMessage("sessionId is required")
            .escape(),
        check('limit') // optional but must be numeric
            .optional()
            .isNumeric().withMessage("limit must be numeric"),
        check('offset') // optional but must be numeric
            .optional()
            .isNumeric().withMessage("offset must be numeric"),
        validationErrorHandler,
        sessionExistsAndAuthorized,
        handleSesssionHistory
    );

    router.get("/list-sessions",
        authenticateJWTWithCookies,
        handleListSessions
    );

    router.post("/message",
        // (req, res, next) => {
        //     console.log("message", JSON.stringify(req.body));
        //     next();
        // },
        authenticateJWTWithCookies,
        check('sessionId')
            .exists().not().isEmpty().withMessage("sessionId is required")
            .escape(),
        check('message')
            .exists().not().isEmpty().withMessage("message is required")
            .trim().escape(),
        validationErrorHandler,
        sessionExistsAndAuthorized,
        handleMessage
    );
}