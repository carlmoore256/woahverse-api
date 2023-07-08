import { ChatOpenAI } from 'langchain/chat_models/openai';
import { getDDGSTextSearchTool } from '../tools/duckDuckGoSearch';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { Serialized } from "langchain/load/serializable";
import { InputValues, LLMResult } from "langchain/schema";
import { logMessage, LogColor } from '../utils/logging';
import { Tool } from 'langchain/tools';
import { AgentExecutor } from 'langchain/agents';
import { ChainValues } from 'langchain/schema';
import { HumanChatMessage } from "langchain/schema";
import { PromptTemplate } from "langchain/prompts";
import { BufferMemory } from "langchain/memory";

import dotenv from "dotenv";
import { BaseChain } from 'langchain/chains';
dotenv.config();

export interface IChatSessionParameters {
    id? : string;
    temperature : number;
    modelName : string;
    maxIterations : number;
}

const DEFAULT_MODEL = "gpt-3.5-turbo";

export const DEFAULT_CHAT_MODEL_PARAMETERS : IChatSessionParameters = {
    temperature: 0.8,
    modelName: DEFAULT_MODEL,
    maxIterations: 20,
}


export class ChatSession {
    
    model : ChatOpenAI;
    parameters : IChatSessionParameters;
    chain : BaseChain | null = null;
    tokenUsage : number = 0;

    inputKey : string = "question";
    outputKey : string = "text";

    memory : BufferMemory | null = null;

    constructor(
        parameters : Partial<IChatSessionParameters>, 
        openAIApiKey : string = process.env.OPENAI_API_KEY as string) 
    {

        // fill in missing parameters
        const filledParameters: IChatSessionParameters = Object.assign({}, 
            DEFAULT_CHAT_MODEL_PARAMETERS, 
            parameters);

        this.parameters = filledParameters;

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
    }

    setChain(executor : BaseChain) { // sometimes, this might be an agentExecutor,
        // other times, it might be a a base chain or whatever
        this.chain = executor;
    }

    getPrompt() {
        // return this.chain.prompt;
    }

    // call the chatbot as an agent
    async call(question : string, additionalVariables : ChainValues = {}, streamCallback : (token : string) => void) : Promise<any> {

        // this.history.push(newHistory);
        if (!this.chain) {
            throw new Error("Chain not set!");
        }

        const chainInput = {
            [this.inputKey]: question,
            ...additionalVariables
        }

        // instead of awaiting, we will return the promise
        const output = await this.chain!.call(chainInput, [{
            handleLLMNewToken: (token) => streamCallback(token)
        }]);
        
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
}