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

import dotenv from "dotenv";
dotenv.config();

export interface IChatbotParameters {
    id? : string;
    temperature : number;
    agentType : AgentType;
    modelName : string;
    maxIterations : number;
    tools : Tool[];
    promptTemplate?: PromptTemplate;
}

const DEFAULT_MODEL = "gpt-3.5-turbo";

export const DEFAULT_CHATBOT_PARAMETERS : IChatbotParameters = {
    temperature: 0.8,
    modelName: DEFAULT_MODEL,
    agentType: "chat-conversational-react-description",
    maxIterations: 20,
    tools: [],
}

export type AgentType = "zero-shot-react-description" | "chat-zero-shot-react-description" | "chat-conversational-react-description";


// export interface IChatbotCallback extends IToolCallback {
export interface IChatbotHistory {
    input? : string;
    intermediate? : string[] | any[];
    output? : string;
}

// if instead we changed this into a managedChatModel, then the implementation of the chains 
// could be abstracted away from the chatbot
export class GPTChatbot {
    
    model : ChatOpenAI;
    parameters : IChatbotParameters;
    tools : Tool[];
    executor : AgentExecutor | null = null;
    tokenUsage : number = 0;
    history : IChatbotHistory[] = [];

    constructor(
        parameters : Partial<IChatbotParameters>, 
        openAIApiKey : string = process.env.OPENAI_API_KEY as string) 
    {

        // fill in missing parameters
        const filledParameters: IChatbotParameters = Object.assign({}, 
            DEFAULT_CHATBOT_PARAMETERS, 
            parameters);

        this.tools = filledParameters.tools;
        this.parameters = filledParameters;

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
    }

    public addTool(tool : Tool) {
        this.tools.push(tool);
    }


    async getExecutor() {
        return initializeAgentExecutorWithOptions(
            this.tools,
            this.model,
            {
                agentType: this.parameters.agentType,
            }
        );
    }

    async callAgentWithPrompt(promptVariables : ChainValues, streamCallback : (token : string) => void) : Promise<any> {
        if (!this.parameters.promptTemplate) {
            throw new Error("Instance of GPTChatbot has no prompt template");
        }
        if (!this.executor) this.executor = await this.getExecutor();

        const output = await this.executor.call(promptVariables, [{
            handleLLMNewToken: (token) => streamCallback(token)
        }]);

        if (output.llmOutput) {
            this.tokenUsage += output.llmOutput.tokenUsage;
        }

        if (output.output) {
            return output.output;
        }
        return null;
    }

    // call the chatbot as an agent
    async call(input : string, additionalVariables : ChainValues = {}, streamCallback : (token : string) => void) : Promise<any> {
        const newHistory : IChatbotHistory = { input };

        this.history.push(newHistory);

        if (!this.executor) this.executor = await this.getExecutor();

        // instead of awaiting, we will return the promise
        const output = await this.executor.call({ input, ...additionalVariables }, [{
            handleLLMNewToken: (token) => streamCallback(token)
        }]);
        
        if (output.intermediate) newHistory.intermediate = output.intermediate;
        
        // somehow get the token usage here, then add it to the token usage
        
        if (output.output) {
            newHistory.output = output.output;  
            this.log(`output.output: ${output.output}`, LogColor.Cyan);
            return output.output;
        }
        return null;
    }

    serializeHistory() {
        return JSON.stringify(this.history);
    }

    private async handleLLMStart(llm : Serialized, prompts : string[]) {
        
    }

    private async handleLLMEnd(output : LLMResult) {
        if (output.llmOutput) {
            this.log(`output.llmOutput: ${output.llmOutput}`, LogColor.Cyan);
            this.tokenUsage += output.llmOutput.tokenUsage;
        }
    }

    private async handleLLMError(err : Error) {
        this.log(`${err.message}`, LogColor.Red);
    }

    private log(message : string, color : LogColor = LogColor.White) {
        logMessage(`[CHATBOT: ${this.parameters.id}] ${message}`, LogColor.Cyan);
    }
}