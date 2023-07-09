import { GPTChatbot, IChatbotParameters, DEFAULT_CHATBOT_PARAMETERS } from "./GPTChatbot";
import { generateId } from "../utils/id";
import { logMessage, LogColor } from "../utils/logging";
import { Tool } from "langchain/tools";
import { ChatSession, IChatSessionParameters } from "./ChatSession";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
  } from "langchain/prompts";
import { WOAH_SYSTEM_MESSAGE } from "../definitions";
// export interface IChatSession {
//     id : string;
//     userId : string; // eventually add support for this, by linking to our database
//     chatbot : GPTChatbot;
//     startedAt : Date;
//     lastMessageAt : Date | null;
//     ipAddress? : string;
// }

export interface IChatSesionManagerParameters {
    chatbotParameters : Partial<IChatbotParameters>;
    envAPIKey : string;
    monitorInterval : number;
}

export const DEFAULT_CHAT_SESSION_MANAGER_PARAMETERS : IChatSesionManagerParameters = {
    chatbotParameters: DEFAULT_CHATBOT_PARAMETERS,
    envAPIKey: "WOAHVERSE_OPENAI_API_KEY",
    monitorInterval: 1000 * 60 * 10, // 10 minutes
}

export type SessionRejection = "user-session-exists" | "user-not-registered";

const SESSION_ID_LENGTH = 8;


// handles the memory of an active session of multiple clients chatting with a chatbot
export class ChatSessionManager {

    private activeSessions : Record<string, ChatSession> = {};
    private sessionParameters : Partial<IChatSessionParameters>; // this could be changed
    // by collective user input, so its mood can change temperature
    private envAPIKey : string;
    private monitorInterval : number;

    constructor(parameters : IChatSesionManagerParameters) {
        this.sessionParameters = parameters.chatbotParameters;
        this.envAPIKey = parameters.envAPIKey;
        this.monitorInterval = parameters.monitorInterval;
    }

    createSession(userId : string) : ChatSession {

        const newSession : ChatSession = new ChatSession(
            userId,
            { 
                temperature: this.sessionParameters.temperature, 
                modelName: this.sessionParameters.modelName,
                maxIterations: this.sessionParameters.maxIterations,
                prompt: ChatPromptTemplate.fromPromptMessages([
                    SystemMessagePromptTemplate.fromTemplate(WOAH_SYSTEM_MESSAGE),
                    new MessagesPlaceholder("history"),
                    HumanMessagePromptTemplate.fromTemplate("{input}"),
                ]),
            },
            process.env[this.envAPIKey] as string);

        this.activeSessions[sessionId] = newSession;
        return newSession;
    }

    monitorSessions() {
        setInterval(() => {
            const now = new Date();
            for (const userId in this.activeSessions) {
                const session = this.activeSessions[userId];
                if (now.getTime() - session.lastMessageAt!.getTime() > this.monitorInterval) {
                    this.endSession(userId);
                }
            }
        }, this.monitorInterval);
    }

    saveSession(session : ChatSession) {
        // log the session into the database
        // session.serializeHistory();
    }

    restoreSession(sessionId : string) : ChatSession | null {
        // restore the session from the database
        return null;
    }

    hasActiveSession(userId : string) : Boolean {
        return userId in this.activeSessions;
    }

    getSession(userId : string) : ChatSession | null {
        if (userId in this.activeSessions == false) {
            return null;
        }
        return this.activeSessions[userId];
    }

    endSession(userId : string) {
        delete this.activeSessions[userId];
    }

    endAllSessions() {
        this.activeSessions = {};
    }

    getAllActiveSessions(timeThreshold : number | null = null) : ChatSession[] {
        if (timeThreshold !== null) {
            const now = new Date();
            return Object.values(this.activeSessions).filter(session => {
                return now.getTime() - session.lastMessageAt!.getTime() < timeThreshold;
            });
        }
        return Object.values(this.activeSessions);
    }

    getTotalTokenUsage() : number {
        return this.getAllActiveSessions().reduce((total, session) => {
            return total + session.tokenUsage;
        }, 0);
    }

    loadSession(sessionId : string) : ChatSession | null {
        // load the session from the database
        return null;
    }
}