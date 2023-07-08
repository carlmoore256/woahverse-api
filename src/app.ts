import app from "./api/api";
import { DatabaseClient } from "./database/DatabaseClient";
import { Debug } from "./utils/Debug";

Debug.log("Starting database...");
const db = new DatabaseClient();

Debug.log("Starting api...");
app.run();