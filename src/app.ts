import app from "./api/api";
import { DatabaseClient } from "./database/DatabaseClient";
import { Debug } from "./utils/Debug";

async function main() {
    
    Debug.log("Starting database...");
    const db = new DatabaseClient();
    await db.connect();
    
    Debug.log("Starting api...");
    app.run();

}

main();
