import { IChatSession } from "../../chat-session/session";

/*
* This function is used to stream the chatbot's response to the client.
*/
export const streamChatbotHandler = (req : any, res : any, session : IChatSession, message : string) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client
    let connectionOpen = true;
    const abortController = new AbortController();
    session.chatbot.call(message, { signal: abortController.signal }, (reply) => {
        if (connectionOpen) res.write(reply);
    }).then((finalOutput) => {
        console.log("GOT FINAL OUTPUT", finalOutput);
        res.end();
        return;
    });
    res.on('close', () => {
        console.log('client dropped - aborting chatbot call');
        abortController.abort();
        connectionOpen = false;
        res.end();
    });
}