import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Serialized } from "langchain/load/serializable";
import { InputValues, LLMResult, ChainValues } from "langchain/schema";
import { BufferMemory, ConversationSummaryMemory } from "langchain/memory";
import { ConversationChain, BaseChain } from "langchain/chains";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
} from "langchain/prompts";
import { logMessage, LogColor } from '../utils/logging';
import { DatabaseClient } from "../database/DatabaseClient";
import { generateId } from '../utils/id';
import { Debug } from '../utils/Debug';
import dotenv from "dotenv";
import { Response } from "express";
import { off } from 'process';
import { getLLMResultTexts } from '../utils/langchain';

dotenv.config();

export interface IChatMessage {
    id : string;
    message : string;
    role : string;
    createdAt : Date;
}

export interface IChatSession {
    id? : string;
    userId : string;
    createdAt? : Date;
    title? : string | null;
}

interface IChatSessionInfo extends IChatSession {
    numMessages : number;
}

export interface IChatSessionParameters {
    temperature : number;
    modelName : string;
    maxIterations : number;
    prompt : ChatPromptTemplate;
}

export const DEFAULT_CHAT_SESSION_PARAMETERS : IChatSessionParameters = {
    temperature: 0.8,
    modelName: "gpt-3.5-turbo",
    maxIterations: 20,
    prompt: ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know."
        ),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]),
}



const SESSION_ID_LENGTH = 16;

export class ChatSession {

    public id : string;
    public userId : string;
    public title? : string | null;

    private model : ChatOpenAI;
    private _chain : BaseChain | null = null;
    
    private inputKey : string = "input";
    private outputKey : string = "response";
    
    private memory : BufferMemory | null = null;
    public lastMessageAt : Date | null = null;
    public tokenUsage : number = 0; // we have issues setting this with streaming
    
    public get chain() : BaseChain {
        if (!this._chain) throw new Error("Chain not set!");
        return this._chain;
    }

    public set chain(chain : BaseChain) { this._chain = chain; }

    constructor(
        public sessionInfo : IChatSession,
        private parameters : IChatSessionParameters, 
        openAIApiKey : string = process.env.OPENAI_API_KEY as string,
        private useDatabase : boolean = true) 
    {
        if (!sessionInfo.id) {
            this.id = generateId(SESSION_ID_LENGTH);
        } else {
            this.id = sessionInfo.id;
        }
        this.userId = sessionInfo.userId;
        if (sessionInfo.title) this.title = sessionInfo.title;     

        
        this.model = new ChatOpenAI({
            temperature: parameters.temperature,
            modelName: parameters.modelName,
            verbose: false,
            streaming: true,
            openAIApiKey,
            callbacks: [
                {
                    handleLLMStart: (llm, prompts) => this.handleLLMStart(llm, prompts),
                    handleLLMEnd: (output) => this.handleLLMEnd(output),
                    handleLLMError: (err) => this.handleLLMError(err)
                }
            ],
        });

        const hasHistory = parameters.prompt.promptMessages.some((promptMessage) => {
            return promptMessage.inputVariables.includes("history");
        });
        if (!hasHistory) throw new Error("Prompt must have a history variable!");

        // this.memory = new BufferMemory({ returnMessages: true, memoryKey: "history" });
        // https://js.langchain.com/docs/modules/memory/examples/conversation_summary
        this.memory = new ConversationSummaryMemory({ 
            memoryKey: "history",
            returnMessages: true,
            llm : new ChatOpenAI({ 
                modelName: "gpt-3.5-turbo", 
                temperature: 0.5, 
                openAIApiKey,
                callbacks: [
                    {
                        handleLLMEnd: (output) => {
                            this.log(`[SUMMARY LLM OUTPUT]\n${JSON.stringify(getLLMResultTexts(output))}`, 
                                        LogColor.BrightCyan)
                            this.tokenUsage += output.llmOutput?.tokenUsage?.totalTokens || 0;
                        },
                    }
                ] 
            }) 
        });

        this.chain = new ConversationChain({
            memory: this.memory,
            prompt: parameters.prompt,
            llm: this.model,
        });

        // we don't wanna insertIntoDatabase immediately, because sometimes we need to 
        // create a session that already exists in the database. We also want to pass 
        // insert errors down to client as an error, so we need to call the async insert
    }



    public async insertSessionIntoDatabase() {
        const exists = await ChatSession.existsInDatabase(this.id);
        if (exists) throw new Error("Session already exists in database!");
        console.log(`Trying to insert session ${this.id} | userId ${this.userId}`)
        return await DatabaseClient.Instance.insert('chat_sessions', {
            id: this.id,
            user_id: this.userId,
        })
    }

    private async insertMessageIntoDatabase(message : string, role : string) : Promise<boolean> {
        return await DatabaseClient.Instance.insert('messages', {
            id: generateId(SESSION_ID_LENGTH),
            chat_session_id: this.id,
            message,
            role
        })
    }



    /**
     * Call the chain (send a message) with the given message and additional variables
     */
    public async call(message : string, additionalVariables : ChainValues = {}, streamCallback : (token : string) => void) : Promise<string | null> {
        const chainInput = {
            [this.inputKey]: message,
            ...additionalVariables
        }

        if (this.useDatabase) {
            await this.insertMessageIntoDatabase(message, "human");
        }

        const output = await this.chain.call(chainInput, [{
            handleLLMNewToken: (token) => {
                this.tokenUsage += 1;
                streamCallback(token);
            }
        }]);

        // set here, so it only updates after success
        this.lastMessageAt = new Date();
        // check out output.intermediate

        if (output[this.outputKey]) {
            this.log(`output: ${output[this.outputKey]}`, LogColor.Cyan);
            if (this.useDatabase) {
                await this.insertMessageIntoDatabase(output[this.outputKey], "ai");
            }
            return output[this.outputKey];
        }
        return null;
    }

    private async handleLLMStart(llm : Serialized, prompts : string[]) {
        this.log(`[LLM START]\n${JSON.stringify(prompts)}`)
    }

    private async handleLLMEnd(output : LLMResult) {
        
        // expand the generations into a list of text
        const generations : string[][] = [];
        output.generations.forEach((generation) => {
            generations.push(generation.map(g => g.text))
        })
        if (output.llmOutput) {
            this.log(`[LLM END]\n${generations}`, LogColor.Cyan);
            // this.tokenUsage += output.llmOutput.tokenUsage;
        }
    }

    private async handleLLMError(err : Error) {
        this.log(`${err.message}`, LogColor.Red);
    }

    private log(message : string, color : LogColor = LogColor.White, newline : boolean = true) {
        logMessage(`${newline ? "\n" : ""}[CHAT ${this.id}] ${message}`, color);
    }

    /**
     * Stream the LLM output to client
     * @param message the string message to send to the LLM
     * @param res the response object to stream the output to
     */
    public async streamResponseToClient(message : string, res : Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // flush the headers to establish SSE with client
        let connectionOpen = true;
        const abortController = new AbortController();
        
        // hooks into itself here to write the reply to the stream
        this.call(message, {}, (reply) => { // { signal: abortController.signal }

            if (connectionOpen) res.write(`data: ${JSON.stringify(reply)}\n\n`);
            
        }).then((finalOutput) => {
            res.write("event: close\ndata: \n\n"); // add this line to send a "close" event
            res.end();
            return;
        });

        res.on('close', () => {
            console.log("client dropped - aborting chatbot call")
            connectionOpen = false;
            res.end();
        });
    }


    public async getMessageHistory(limit : number, offset? : number) : Promise<IChatMessage[]> {
        offset = offset || 0;
        console.log(`Getting message history for session ${this.id} with limit ${limit} and offset ${offset}`);
        const messages = await DatabaseClient.Instance.queryRows(
            `SELECT 
                id, message, created_at, role 
            FROM 
                messages 
            WHERE 
                chat_session_id = $1
            ORDER BY
                created_at DESC
            LIMIT $2
            OFFSET $3`,
            [this.id, limit, offset]
        );
        // if (!messages) throw new Error("Could not get messages from database");
        if (!messages) {
            console.log("Could not get messages from database");
            return [];
        }
        return messages.map((message) => {
            return {
                id: message.id,
                message: message.message,
                createdAt: message.created_at,
                role: message.role
            }
        });
    }
    

    // ============================================
    // ============== STATIC METHODS ==============
    // ============================================

    /**
     * Check if the session exists in the database
     * @param sessionId string id of the session
     * @returns Promise<boolean> whether the session exists
     */
    public static async existsInDatabase(sessionId : string) : Promise<boolean> {
        const sessionExists = await DatabaseClient.Instance.query(
            `SELECT * FROM chat_sessions WHERE id = $1`,
            [sessionId]
        );
        console.log(`Session ${sessionId} exists in database: ${sessionExists.rowCount > 0}`);
        return sessionExists.rowCount > 0;
    
    }

    /**
     * Check if the session exists in the database and is owned by the user
     * @param sessionId string id of the session
     * @param userId string id of the user
     * @returns Promise<boolean> whether the session exists and is owned by the user
     */
    public static async verifyOwnership(sessionId : string, userId : string) : Promise<boolean> {
        console.log(`Verifying ownership of session ${sessionId} for user ${userId}`)
        const sessionExists = await DatabaseClient.Instance.query(
            `SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2`,
            [sessionId, userId]
        );
        return sessionExists.rowCount > 0;
    }

    /**
     * Returns a list of all sessions in the database for a given user
     */
    public static async listSessions(userId : string, minLength = 1) : Promise<IChatSessionInfo[]> {
        const sessions = await DatabaseClient.Instance.queryRows(
            `SELECT
                id, user_id, created_at, title
            FROM
                chat_sessions
            WHERE
                user_id = $1
            ORDER BY
                created_at DESC`,
            [userId]
        );
        if (!sessions) return [];
        // async get all of these
        const sessionPromises = sessions.map(async (session) => {
            const messagesCountQuery = await DatabaseClient.Instance.queryFirstRow(`
                SELECT
                    COUNT(id) as message_count
                FROM
                    messages
                WHERE
                    chat_session_id = $1
            `, [session.id]);
            const numMessages = messagesCountQuery.message_count || 0;

            return {
                id: session.id,
                userId: session.user_id,
                createdAt: session.created_at,
                title: session.title,
                numMessages
            }
        });

        const sessionInfos = await Promise.all(sessionPromises);
        return sessionInfos.filter((info) => info.numMessages >= minLength);
    }
    

    /**
     * Load a ChatSession from the database, given a sessionId
     */
    public static async loadFromDatabase(
            sessionId : string, 
            parameters : IChatSessionParameters,
            openAIApiKey?: string,
            useDatabase: boolean=true) : Promise<ChatSession | null> {
        
        const session = await DatabaseClient.Instance.queryFirstRow(
            `SELECT
                id, user_id, created_at, title
            FROM
                chat_sessions
            WHERE
                id = $1`,
            [sessionId]
        ) as { id : string, user_id : string, title : string } | null;
        if (!session) return null;
        return new ChatSession({
            id: session.id,
            userId: session.user_id,
            title: session.title,
        }, parameters, openAIApiKey, useDatabase);
    }
}