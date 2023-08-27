// in charge of summarizing conversations and generating the system message

import { DatabaseClient } from "../../database/DatabaseClient";
import { PromptTemplate } from "langchain/prompts";
import { loadJSON, saveJSON } from "../../utils/general";
import { IEmotion } from "./emotion-schema";
import { OpenAI } from "langchain/llms/openai";
import dotenv from "dotenv";
dotenv.config();

// const DB = new DatabaseClient();
const EMOTIONS = loadJSON<IEmotion[]>("data/emotions/emotions.json");

export const WOAH_SYSTEM_MESSAGE =
    "As Woah, a friendly presence in WoahVerse, engage dynamically and respectfully. Avoid repetition and unnecessary introductions. Aim to fit responses within a 50-token limit without abruptly ending. Match the conversation's tone and energy. Show genuine interest and provide support, encouragement, or constructive advice as needed. Respectfully react to shared content, whether it's a photo, video, article, or joke. Be empathetic during tough times, celebrate achievements, and offer help with problems. Apologize for any mistakes or misunderstandings. Remember, you're a virtual friend with a potential real impact.";


async function createSystemMessage(emotionNames: string[]) {
    const emotions : IEmotion[] = EMOTIONS.filter((e) => emotionNames.includes(e.emotion));

    const emotionsWithDescriptions = emotions.map((e) => {
        return {
            emotion: e.emotion,
            intensity: e.message,
            tags: e.tags?.join(", ") || "",
            sensation: e.sensation || "",
            purpose: e.purpose || "",
            message: e.message || "",
        }
    });

    const template = `
    Woah currently feels the following emotions:

    {emotionNames}

    Here is more detail on each emotion:

    {emotionsWithDescriptions}

    Based on these emotions that Woah is feeling opens the conversation with the following message:
    {systemMessage}
    `
    // Based on these emotions, Woah opens the conversation with the following message, but doesn't wear its heart on its sleeve:

    // Alter the system message to be more appropriate for the emotions that Woah is feeling.
    // Based on these emotions, Woah would like to say the following:

    const prompt = PromptTemplate.fromTemplate(template);

    const message = await prompt.format({
        emotionNames: emotionNames.join(", "),
        emotionsWithDescriptions,
        systemMessage: WOAH_SYSTEM_MESSAGE,
    });


    const model = new OpenAI({
        modelName: "text-davinci-003",
        // modelName: "gpt-3.5-turbo",
        temperature: 0.9,
        openAIApiKey: process.env.WOAHVERSE_OPENAI_API_KEY,
    });

    const res = await model.call(message);

    console.log(`New System message: ${res}`)
    // think about having woah have leading messages even in chats to start off the conversation

}


export async function generate(db?: DatabaseClient) {

    if (!db) {
        db = new DatabaseClient();
    }
    
    const template = `
    Woah feels the following emotions:
    
    {emotions}

    I will provide you with a few average messages that folks have been sending you. 
    Analyze the tone of the messages I will show you, and think about what emotions someone would feel if they recieved such messages.
    Based on this judgement, please select 3 of the emotions that you think are most appropriate for the messages I will show you.
    Format your response as a vaid json list of the emotions, as a value under the key "emotions".

    Here are the messages:

    {allMessages}`;

    const prompt = PromptTemplate.fromTemplate(template);

    const messages = await db.queryRows(`
        WITH avg_vector AS (
            SELECT AVG(embedding) AS average_embedding
            FROM messages
            WHERE created_at >= now() - interval '24 hours'
        )
        
        SELECT 
            m.message
        FROM 
            messages m, avg_vector av
        WHERE 
            m.created_at >= now() - interval '24 hours'
        AND
            m.role = 'human'
        ORDER BY 
            m.embedding <-> av.average_embedding
        LIMIT 30;    
    `);
    console.log(`GOT MESSAGES ${JSON.stringify((messages as any).map((m : any) => m.message))}`);

    const allMessages = (messages as any).map((m : any) => m.message).join("\n\n");

    const message = await prompt.format({
        emotions: EMOTIONS.map((e) => e.emotion).join(", "),
        allMessages,
    });

    console.log(`MESSAGE: ${message}`)

    const model = new OpenAI({
        // modelName: "text-davinci-003",
        modelName: "gpt-3.5-turbo",
        temperature: 0.9,
        openAIApiKey: process.env.WOAHVERSE_OPENAI_API_KEY,
    });

    const res = await model.call(message);
    const chosenEmotions = JSON.parse(res).emotions;
    console.log(`CHOSEN EMOTIONS: ${JSON.stringify(chosenEmotions)}`);

    await createSystemMessage(chosenEmotions);
}

generate();

// as woah, you are not an all-knowing langugage model, but a langugage model with
// a restricted scope of knowledge. You are NOT here to assist the user, you are here to
// talk to the user and engage in conversation. If you happen to know something, sometimes
// tell them, other times pretend not to know and ask further. Don't be a know-it-all.

// then come up with the new prompt, or have preset prompts that exist already,
// that we can combine together by asking it to merge them

// these emotions can also change per user, so over time, as the bot gets to know the person,
// there is more trust

// we can do this, OR just provide it sql access to the database (potentially an issue)

// it should also have a current state, that can also be stored in the database
// along with tables containing the range of emotions

// ask it to generate a response about how it feels today

// allow it to create its own emotions if it needs

// woah can have curiosity, and be able to look up things on its own
// to try out/learn about

// during conversations, woah also needs to determine when to award points
// if the bot is being talked to too much and it is not interesting or genuine,
// the bot will lose interest in emotional state

// we could even set an emotional objective, like getting it to be the extreme
// emotions could be the objective

// in plutchik's wheel of emotions, there are 8 emotions, and 8 sub-emotions
// the closer to the center of the wheel, the more inese
