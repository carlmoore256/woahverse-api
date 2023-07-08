import { Router } from 'express';
import { generateId } from '../../utils/id';
import { ChatSessionManager } from '../../chat-session/ChatSessionManager';
import { IChatbotParameters } from '../../chat-session/GPTChatbot';
import { Handler } from 'express';

const router = Router();

const MODEL_PARAMETERS : Partial<IChatbotParameters> = {
    temperature: 0.8,
    modelName: "gpt-3.5-turbo",
    agentType: "chat-conversational-react-description",
    maxIterations: 20,
}

const SESSION = new ChatSessionManager({
    chatbotParameters: MODEL_PARAMETERS,
    envAPIKey : "WOAHVERSE_OPENAI_API_KEY",
    monitorInterval : 1000 * 60 * 10 // 10 minutes
})


const sessionNotFound = (res : any) => {
    res.status(400).send({
        "error" : "session-not-found",
    });
}

export interface IMessageRequest {
    sessionId : string;
    message : string;
}



const handleNewSession : Handler = async (req, res) => {
    // eventually have userId be authenticated
    // with the bearer token
    const TEMP_ID_DELETEME = generateId(12);

    const session = SESSION.createSession(TEMP_ID_DELETEME);

    if (typeof session === "string") {
        res.status(400).send({ "error" : session });
        return;
    }

    res.send({ "userId" : TEMP_ID_DELETEME });
    // res.send({ "sessionId" : session.id })
}

const handleMessage : Handler = async (req, res) => {
    // check if req.body is valid IMessageRequest
    if (!req.body.userId || !req.body.message) {
        res.status(400).send({ "error" : "invalid-request" });
        return;
    }
    
    // here we must authenticate with bearer token
    // to make sure requester is owner of session
    const userId = req.body.userId; // <- INSTEAD OF THIS USE THE JWT BEARER TOKEN
    const message = req.body.message;

    if (!SESSION.hasActiveSession(userId)) return sessionNotFound(res);
    const session = SESSION.getSession(userId);
    if (!session) return sessionNotFound(res);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    let connectionOpen = true;

    const response = await session.chatbot.call(message, {}, (message) => {
        if (connectionOpen) res.write(`data: ${JSON.stringify({message})}\n\n`);
    });
    
    res.on('close', () => {
        console.log('client dropped');
        connectionOpen = false;
        res.end();
    });

    // res.send({ "response" : response });
}


function SSEHandler(req: any, res: any, callback : (req : any, res : any) => void) {

}



export default (parent : Router) => {

    parent.use("/chat", router);

    router.get("/", async (req, res) => res.send("Hello World"));

    // creates a new client chat session
    router.get("/new-session", handleNewSession);

    router.post("/message", handleMessage);

    router.get('/streaming', (req, res) => {

        // res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // flush the headers to establish SSE with client
    
        let counter = 0;
        let interValID = setInterval(() => {
            counter++;
            if (counter >= 10) {
                clearInterval(interValID);
                res.end(); // terminates SSE session
                return;
            }
            res.write(`data: ${JSON.stringify({num: counter})}\n\n`); // res.write() instead of res.send()
        }, 1000);
    
        // If client closes connection, stop sending events
        res.on('close', () => {
            console.log('client dropped me');
            clearInterval(interValID);
            res.end();
        });
    });

    // router.get("/active-sessions", async (req, res) => {
    //     res.send(JSON.stringify(SESSION.getAllActiveSessions()));
    // });

}