import { LLMResult } from "langchain/schema";

export function getLLMResultTexts(result : LLMResult) : string[][] {
    return result.generations.map(generation => generation.map(g => g.text));
}