import { IChatSessionParameters, ChatSession, DEFAULT_CHAT_SESSION_PARAMETERS } from "./ChatSession";
import { DatabaseClient } from "../database/DatabaseClient";


export interface IChatSesionManagerParameters {
    chatbotParameters : IChatSessionParameters;
    envAPIKey : string;
    monitorInterval : number;
}

export const DEFAULT_CHAT_SESSION_MANAGER_PARAMETERS : IChatSesionManagerParameters = {
    chatbotParameters: DEFAULT_CHAT_SESSION_PARAMETERS,
    envAPIKey: "WOAHVERSE_OPENAI_API_KEY",
    monitorInterval: 1000 * 60 * 10, // 10 minutes
}


// handles the memory of an active session of multiple clients chatting with a chatbot
export class ChatSessionManager {

    private activeSessions : Record<string, ChatSession> = {};
    private sessionParameters : IChatSessionParameters;
    // by collective user input, so its mood can change temperature
    private envAPIKey : string;
    private monitorInterval : number;

    constructor(parameters : IChatSesionManagerParameters) {
        this.sessionParameters = parameters.chatbotParameters;
        this.envAPIKey = parameters.envAPIKey;
        this.monitorInterval = parameters.monitorInterval;
    }

    async createSession(userId : string) : Promise<ChatSession> {
        const newSession : ChatSession = new ChatSession(
            userId,
            this.sessionParameters, // give the chatbot the same parameters as the session
            process.env[this.envAPIKey] as string
        );

        const insertRes = await newSession.insertSessionIntoDatabase();
        if (!insertRes) {
            throw new Error("Failed to insert session into database.");
        }

        this.activeSessions[newSession.id] = newSession;
        return newSession;
    }

    /**
     * Loads an existing chat session from the database
     */
    async loadSession(sessionId : string) : Promise<ChatSession> {
        // load the session from the database
        if (!ChatSession.existsInDatabase(sessionId)) {
            throw new Error("Session does not exist in database.");
        }

        const queryRes = await DatabaseClient.Instance.queryFirstRow(
            "SELECT id, user_id FROM chat_sessions WHERE id = $1",
            [sessionId]
        ) as { id : string, user_id : string } | null;

        if (queryRes === null) {
            throw new Error("Failed to load session from database.");
        }

        const newSession = new ChatSession(
            queryRes.user_id,
            this.sessionParameters, // give the chatbot the same parameters as the session
            process.env[this.envAPIKey] as string
        );

        this.activeSessions[sessionId] = newSession;
        return newSession; 
    }

    private monitorSessions() {
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

    public hasActiveSession(userId : string) : Boolean {
        return userId in this.activeSessions;
    }

    public getSession(userId : string) : ChatSession | null {
        if (userId in this.activeSessions == false) {
            return null;
        }
        return this.activeSessions[userId];
    }

    public endSession(userId : string) {
        delete this.activeSessions[userId];
    }

    public endAllSessions() {
        this.activeSessions = {};
    }

    public getAllActiveSessions(timeThreshold : number | null = null) : ChatSession[] {
        if (timeThreshold !== null) {
            const now = new Date();
            return Object.values(this.activeSessions).filter(session => {
                return now.getTime() - session.lastMessageAt!.getTime() < timeThreshold;
            });
        }
        return Object.values(this.activeSessions);
    }

    public getTotalTokenUsage() : number {
        return this.getAllActiveSessions().reduce((total, session) => {
            return total + session.tokenUsage;
        }, 0);
    }


}