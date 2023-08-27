import {
    yesNoPrompt,
    selectPrompt,
    inputPrompt,
    queryInputPrompt,
    queryBuilderPrompt,
} from "./cli-prompts.js";
import { DatabaseClient } from "../database/DatabaseClient.js";
import { vectorizeAll, VECTORIZE_CHAT_MESSAGES } from "../jobs/generateEmbeddings.js";
import dotenv from "dotenv";
import Debug from "../utils/Debug.js";
import { generate } from "../jobs/emotion/createSystemMessage.js";
dotenv.config();

export class JobsCLI {

    constructor(private dbClient: DatabaseClient) {}

    async main() {
        if (!this.dbClient.isConnected) {
            await this.dbClient.connect();
        }

        while (true) {
            const choice = await selectPrompt<string>(
                [
                    { value: "quit", name: "[Quit]" },
                    { value: "vectorizeChat", name: "Create Embeddings for Chat Messages" },
                    { value: "createSystemMessage", name: "Generate Emotion System Message" }
                ],
                "Select an option"
            );

            switch (choice) {
                case "quit":
                    process.exit(0);
                case "vectorizeChat":
                    await vectorizeAll(
                        this.dbClient,
                        VECTORIZE_CHAT_MESSAGES);
                    break;
                case "createSystemMessage":
                    console.log("CREATING SYSTEM MESSAGE!");
                    await generate(this.dbClient);
                    break;
                default:
                    throw new Error("Invalid choice");
            }
        }
    }
}


const main = async () => {
    Debug.log("Starting Jobs CLI");
    const db = new DatabaseClient();
    await db.connect();
    const cli = new JobsCLI(db);
    await cli.main();
    await db.disconnect();
    return;
}

main();
