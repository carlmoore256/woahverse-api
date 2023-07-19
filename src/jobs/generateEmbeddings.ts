import { DatabaseClient } from "../database/DatabaseClient.js";
import { OpenAIClient } from "../services/OpenAIClient.js";
import { CreateEmbeddingResponseDataInner } from "openai";
import Debug from "../utils/Debug.js";
import { time } from "console";
import ProgressBar, { ProgressBarOptions } from "progress";

const OPENAI_CLIENT = new OpenAIClient();

export interface IVectorizeOptions {
    limit?: number;
    table: string;
    embeddingColumn: string;
    textColumn: string;
    idColumn: string;
}

export const VECTORIZE_CHAT_MESSAGES: IVectorizeOptions = {
    table: "messages",
    embeddingColumn: "embedding",
    textColumn: "message",
    idColumn: "id",
};

export async function vectorizeText(
    text: string,
    entryId: string | number,
    client: DatabaseClient,
    options: IVectorizeOptions
): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            if (text === null) throw new Error("Cannot vectorize null content");
            const { table, embeddingColumn, textColumn, idColumn } = options;
            const response = await OPENAI_CLIENT.embeddings(text);
            const vector = response.data[0].embedding;
            await client.query(
                "UPDATE ${table} SET {embeddingColumn} = $1 WHERE ${idColumn} = $2",
                [JSON.stringify(vector), entryId]
            );
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

async function percentVectorized(client: DatabaseClient, options: IVectorizeOptions) {
    const query = `
        WITH unvectorized AS (
            SELECT COUNT(*) AS total FROM ${options.table} WHERE ${options.embeddingColumn} IS NULL AND ${options.textColumn} IS NOT NULL
        ),
        vectorized AS (
            SELECT COUNT(*) AS total FROM ${options.table} WHERE ${options.embeddingColumn} IS NOT NULL AND ${options.textColumn} IS NOT NULL
        )
        SELECT (vectorized.total / (vectorized.total + unvectorized.total)) * 100 AS percent FROM vectorized, unvectorized`;

    const res = await client.queryFirstRow(query);
    if (!res) throw new Error("Could not get percent vectorized");
    return res.percent;
}

async function vectorizeBatch(
    client: DatabaseClient,
    options: IVectorizeOptions,
    limit: number = 1000
) {
    const { table, embeddingColumn, textColumn, idColumn } = options;
    const rows = await client.queryRows(
        `SELECT * FROM ${table} WHERE ${embeddingColumn} IS NULL AND ${textColumn} IS NOT NULL LIMIT $1`,
        [limit]
    );
    if (!rows) throw new Error(`Could not get ${table} rows`);
    const promises = rows.map((row) =>
        vectorizeText(row, row[idColumn], client, options)
    );
    await Promise.all(promises);
}

// rate limit for openai embeddings is 3000/minute
export async function vectorizeAll(
    client: DatabaseClient,
    options: IVectorizeOptions,
    batchSize: number = 1000,
    delay: number = 1000 * 60,
    maxRetries: number = 5
) {
    const bar = new ProgressBar("Vectorizing [:bar] :percent :etas", {
        complete: "=",
        incomplete: " ",
        total: 100,
    });

    let retries = 0;

    Debug.log("Running vectorize batch...");
    const runBatch = async () => {
        try {
            await vectorizeBatch(client, options, batchSize);
        } catch (error) {
            Debug.error(error);
            retries++;
            if (retries > maxRetries) {
                Debug.error("Max retries exceeded");
                process.exit(1);
            }
        }
        const vectorizedPercent = await percentVectorized(client, options);
        bar.update(vectorizedPercent / 100);
        if (vectorizedPercent < 99.9) {
            setTimeout(runBatch, delay);
        }
    };

    await runBatch();
}

// const client = new DatabaseClient();
// await client.connect();
// vectorizeAll(1000, (1000 * 60) / 3);
