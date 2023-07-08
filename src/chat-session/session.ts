import { GPTChatbot, IChatbotParameters, DEFAULT_CHATBOT_PARAMETERS } from "./GPTChatbot";
import { generateId } from "../utils/id";
import { logMessage, LogColor } from "../utils/logging";
import { Tool } from "langchain/tools";

export interface IChatSession {
    id : string;
    userId : string; // eventually add support for this, by linking to our database
    chatbot : GPTChatbot;
    startedAt : Date;
    lastMessageAt : Date | null;
    ipAddress? : string;
}

export interface IChatSesionManagerParameters {
    chatbotParameters : Partial<IChatbotParameters>;
    envAPIKey : string;
    monitorInterval : number;
}

export const DEFAULT_CHAT_SESSION_MANAGER_PARAMETERS : IChatSesionManagerParameters = {
    chatbotParameters: DEFAULT_CHATBOT_PARAMETERS,
    envAPIKey: "OPENAI_API_KEY",
    monitorInterval: 1000 * 60 * 10, // 10 minutes
}

export type SessionRejection = "user-session-exists" | "user-not-registered";

const SESSION_ID_LENGTH = 8;


// handles the memory of an active session of multiple clients chatting with a chatbot
export class ChatSessionManager {

    private activeSessions : Record<string, IChatSession> = {};
    private chatbotParameters : Partial<IChatbotParameters>;
    private envAPIKey : string;
    private monitorInterval : number;

    constructor(parameters : IChatSesionManagerParameters) {
        this.chatbotParameters = parameters.chatbotParameters;
        this.envAPIKey = parameters.envAPIKey;
        this.monitorInterval = parameters.monitorInterval;
    }

    // register a new session with an ip address
    createSession(userId : string, tools? : Tool[]) : IChatSession | SessionRejection {

        if (userId in this.activeSessions) {
            return "user-session-exists";
        }

        const parameters = {...this.chatbotParameters};
        parameters.id = userId;

        if (tools) {
            parameters.tools = tools;
        }        

        const newSession : IChatSession = {
            id: generateId(SESSION_ID_LENGTH),
            chatbot: new GPTChatbot(parameters, process.env[this.envAPIKey] as string),
            startedAt: new Date(),
            lastMessageAt: null,
            userId: userId
        }

        this.activeSessions[userId] = newSession;
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

    saveSession(session : IChatSession) {
        // log the session into the database
        // session.serializeHistory();
    }

    restoreSession(sessionId : string) : IChatSession | null {
        // restore the session from the database
        return null;
    }

    hasActiveSession(userId : string) : Boolean {
        return userId in this.activeSessions;
    }

    getSession(userId : string) : IChatSession | null {
        return this.activeSessions[userId] || null;
    }

    endSession(userId : string) {
        delete this.activeSessions[userId];
    }

    endAllSessions() {
        this.activeSessions = {};
    }

    getAllActiveSessions(timeThreshold : number | null = null) : IChatSession[] {
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
            return total + session.chatbot.tokenUsage;
        }, 0);
    }
}