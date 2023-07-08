import { input } from '@inquirer/prompts';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { getDDGSTextSearchTool } from './tools/duckDuckGoSearch';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { Calculator } from "langchain/tools/calculator";
import { Serialized } from "langchain/load/serializable";
import { LLMResult } from "langchain/schema";
import select from '@inquirer/select';
import dotenv from "dotenv";

dotenv.config();

export async function main() {

    const model = new ChatOpenAI({
        temperature: 0.8,
        modelName: "gpt-3.5-turbo",
        verbose: true,
        openAIApiKey: process.env.WOAHVERSE_OPENAI_API_KEY,
        callbacks: [
            {
                handleLLMStart: async (llm : Serialized, prompts : string[]) => {
                    console.log("\n======LLM START=======\n");
                    // console.log(JSON.stringify(llm, null, 2));
                    // console.log(JSON.stringify(prompts, null, 2));
                },
                handleLLMEnd: async (output : LLMResult) => {
                    console.log("\n======LLMEnd=======\n");
                    // console.log(JSON.stringify(output, null, 2));
                },
                handleLLMError: async (err : Error) => {
                    console.error(err);
                }
            }
        ],
    });


    const searchType = await select({
        message: 'Select a search type',
        choices: [
            {
                name: 'default',
                value: 'default',
                description: 'Use the default web search',
            },
            {
                name: 'single-site',
                value: 'singleSite',
                description: 'Search a single site',
            },
            {
                name: 'single-filetype',
                value: 'singleFiletype',
                description: 'Search for a single filetype',
            },
        ],
    });


    console.log(searchType);

    switch (searchType) {
        case "default":
            defaultSearchAgent(model);
            break;
        case "singleSite":
            singleSiteSearchAgent(model);
            break;
        case "singleFiletype":
            console.log("singleFiletype");
            break;
        default:
            console.log("default");
            break;
    }


}
// idea - the tools that an agent needs will depend on the question
// that's why we should create a tool that uses another fine-tuned llm or other 
// model to determine the tools that it should use

// idea - when tools are called, there should also be an optional parameter to 
// describe to the model how to use the tool, like calculator does

async function defaultSearchAgent(model: ChatOpenAI | any) {

    const id = "DuckDuckGoSearch";
    // const callback : IToolCallback = {
    //     id,
    //     onInput: async (input : string) => {
    //         console.log(`\n> This is the input to ${id}:`, input);
    //     },
    //     onOutput: async (output : string) => {
    //         console.log(`\n> This is the output to ${id}:`, output);
    //     }
    // }

    // get the tool that allows the repo to be queried
    const ddgsTool = getDDGSTextSearchTool(
        "DuckDuckGoSearch",
        "Useful when you need to search the internet for more general information",
        4000,
        null,); 
        // callback);

    const tools = [
        ddgsTool,
        new Calculator(),
    ];

    // this executor has memory by default
    const executor = await initializeAgentExecutorWithOptions(
        tools,
        model, {
        agentType: "chat-conversational-react-description",
        maxIterations: 30,
    });

    while (true) {
        const question = await input({ message: 'Enter a question:' });
        const result = await executor.call({ input: question });
        console.log(result);
        console.log(
            `Got intermediate steps ${JSON.stringify(
                result.intermediateSteps,
                null,
                2
            )}`
        );
    }
}

async function singleSiteSearchAgent(model: ChatOpenAI | any) {

    const site = await input({ message: 'Enter a site to use for the question' })

    // get the tool that allows the repo to be queried
    const ddgsTool = getDDGSTextSearchTool(
        "DuckDuckGoSearch",
        "Useful when you need to search the internet for more general information",
        4000,
        { site });

    const tools = [
        ddgsTool,
    ];

    const executor = await initializeAgentExecutorWithOptions(
        tools,
        model, {
        agentType: "chat-conversational-react-description",
        maxIterations: 5,
    });

    const result = await executor.call({ input });
}

main();