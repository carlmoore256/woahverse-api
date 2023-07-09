import { ChatOpenAI } from 'langchain/chat_models/openai';
import { getDDGSTextSearchTool } from '../tools/duckDuckGoSearch';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { Serialized } from "langchain/load/serializable";
import { InputValues, LLMResult } from "langchain/schema";
import { logMessage, LogColor } from '../utils/logging';
import { Tool } from 'langchain/tools';
import { AgentExecutor } from 'langchain/agents';
import { ChainValues } from 'langchain/schema';
import { PromptTemplate } from "langchain/prompts";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
  } from "langchain/prompts";
import { Response } from "express";
import { DatabaseClient } from "../database/DatabaseClient";
import { generateId } from '../utils/id';
import { Debug } from '../utils/Debug';

import dotenv from "dotenv";
import { BaseChain } from 'langchain/chains';
dotenv.config();

export interface IChatSessionParameters {
    temperature : number;
    modelName : string;
    maxIterations : number;
    prompt : ChatPromptTemplate;
}

const DEFAULT_MODEL = "gpt-3.5-turbo";

export const DEFAULT_CHAT_MODEL_PARAMETERS : IChatSessionParameters = {
    temperature: 0.8,
    modelName: DEFAULT_MODEL,
    maxIterations: 20,
    prompt: ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know."
        ),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]),
}


export class ChatSession {

    public id : string;
    
    private model : ChatOpenAI;
    private chain : BaseChain | null = null;
    
    private inputKey : string = "input";
    private outputKey : string = "text";
    
    private memory : BufferMemory | null = null;
    public tokenUsage : number = 0;
    public lastMessageAt : Date | null = null;

    constructor(
        private userId : string,
        private parameters : IChatSessionParameters, 
        openAIApiKey : string = process.env.OPENAI_API_KEY as string,
        private useDatabase : boolean = true) 
    {

        this.id = generateId(16);
        
        this.memory = new BufferMemory({ returnMessages: true, memoryKey: "history" });
        // make sure there is a message placeholder for history

        this.model = new ChatOpenAI({
            temperature: parameters.temperature,
            modelName: parameters.modelName,
            verbose: true,
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

        const chain = new ConversationChain({
            memory: this.memory,
            prompt: parameters.prompt,
            llm: this.model,
        });

        this.setChain(chain);

        if (this.useDatabase) {
            // insert this as a new record in the database
            this.insertIntoDatabase().then((res) => {
                Debug.log("Inserted new session into database\n" + JSON.stringify(res));
            }).catch(err => Debug.logError(err));
        }
    }

    public async insertIntoDatabase() {
        return await DatabaseClient.Instance.insert('chat_sessions', {
            id: this.id,
            user_id: this.userId,
        })
    }

    setChain(executor : BaseChain) { // sometimes, this might be an agentExecutor,
        // other times, it might be a a base chain or whatever
        this.chain = executor;
    }

    getPrompt() {
        // return this.chain.prompt;
    }

    // call the chatbot as an agent
    async call(message : string, additionalVariables : ChainValues = {}, streamCallback : (token : string) => void) : Promise<any> {

        // this.history.push(newHistory);
        if (!this.chain) {
            throw new Error("Chain not set!");
        }

        const chainInput = {
            [this.inputKey]: message,
            ...additionalVariables
        }

        // DatabaseClient.Instance.insert('')

        // instead of awaiting, we will return the promise
        const output = await this.chain!.call(chainInput, [{
            handleLLMNewToken: (token) => streamCallback(token)
        }]);

        // set here, so it only updates after success
        this.lastMessageAt = new Date();
        
        // if (output.intermediate) newHistory.intermediate = output.intermediate;
        
        // somehow get the token usage here, then add it to the token usage
        
        if (output.output) {
            // newHistory.output = output.output;  
            this.log(`output: ${output[this.outputKey]}`, LogColor.Cyan);
            return output[this.outputKey];
        }
        return null;
    }

    serializeHistory() {
        // return JSON.stringify(this.history);
    }

    private async handleLLMStart(llm : Serialized, prompts : string[]) {
        
    }

    private async handleLLMEnd(output : LLMResult) {
        if (output.llmOutput) {
            this.log(`Yo dude, here's the output: ${JSON.stringify(output.llmOutput)}`, LogColor.Cyan);
            this.tokenUsage += output.llmOutput.tokenUsage;

        }
    }

    private async handleLLMError(err : Error) {
        this.log(`${err.message}`, LogColor.Red);
    }

    private log(message : string, color : LogColor = LogColor.White) {
        logMessage(`[CHATBOT ${this.parameters.id}] ${message}`, color);
    }

    
    public async streamResponse(message : string, res : Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // flush the headers to establish SSE with client
        let connectionOpen = true;
        const abortController = new AbortController();

        // this.call(message, { signal: abortController.signal }, (reply) => {
        //     if (connectionOpen) res.write(reply);
            
        // }).then((finalOutput) => {
        //     console.log("GOT FINAL OUTPUT", finalOutput);
        //     res.end();
        //     return;
        // });
        
        // this.call(message, { signal: abortController.signal }, (reply) => {
        this.call(message, {}, (reply) => {
            if (connectionOpen) res.write(`data: ${JSON.stringify(reply)}\n\n`);
            
        }).then((finalOutput) => {
            // console.log("GOT FINAL OUTPUT", finalOutput);
            // res.write(`data: ${JSON.stringify(finalOutput)}\n\n`);
            res.write("event: close\ndata: \n\n"); // add this line to send a "close" event
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

    public static async exists(sessionId : string) : Promise<boolean> {
        const sessionExists = await DatabaseClient.Instance.query(
            `SELECT * FROM chat_sessions WHERE id = $1`,
            [sessionId]
        );
        return sessionExists.rowCount > 0;
    
    }

    public static async isSessionOwner(sessionId : string, userId : string) : Promise<boolean> {
        const sessionExists = await DatabaseClient.Instance.query(
            `SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2`,
            [sessionId, userId]
        );
        return sessionExists.rowCount > 0;
    }
}