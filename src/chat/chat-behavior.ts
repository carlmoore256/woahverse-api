
import { IChatSessionParameters } from "./ChatSession"
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
  } from "langchain/prompts";
import { WOAH_SYSTEM_MESSAGE } from "../definitions";
import { ChatSession } from "./ChatSession";
import { ChatSessionManager } from "./ChatSessionManager";

// eventually have these parameters change over time
// depending on the conversations people are having with the chatbot
export const CHAT_SESSION_PARAMETERS : IChatSessionParameters = {
    temperature: 1.0,
    modelName: "gpt-3.5-turbo",
    maxIterations: 20,
    prompt : ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(WOAH_SYSTEM_MESSAGE),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
    ])
}

export async function getCurrentParameters() : Promise<IChatSessionParameters> {
    return CHAT_SESSION_PARAMETERS;
}


/**
 * Holds a chat session manager, and modifies the model parameters and prompts
 * over time, based on the conversations people are having with the chatbot.
 */
export class EmotionManager {
    private chatSessionManager : ChatSessionManager;
    private monitorInterval : number;
    private envAPIKey : string;

    constructor(monitorInterval : number, envAPIKey : string) {
        this.monitorInterval = monitorInterval;
        this.envAPIKey = envAPIKey;
        this.chatSessionManager = new ChatSessionManager({
            chatbotParameters: CHAT_SESSION_PARAMETERS,
            envAPIKey,
            monitorInterval
        });
    }
}