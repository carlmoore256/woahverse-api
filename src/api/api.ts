import { RESTApp } from "./RESTApp";
import { WOAH_API_URL, WOAH_API_VERSION, WOAH_PORT } from "../definitions";
import chat from "./routes/chat";
import auth from "./routes/auth";
import dotenv from "dotenv";
dotenv.config();

let origin : string[] = [];
let sslVariables : any = {
    key: "WOAHVERSE_SSL_KEY",
    cert: "WOAHVERSE_SSL_CERT",
}
let apiUrl = WOAH_API_URL;

if (process.env.DEV_MODE === "true") {
    origin = [
        "http://127.0.0.1:5500",
        "http://localhost:1234",
        "http://localhost:5173",
    ];
    sslVariables = undefined;
    apiUrl = `http://localhost`;
} else {
    origin = [process.env.CORS_ORIGIN as string];
}


export default new RESTApp({
    name: "Woahverse",
    port: WOAH_PORT,
    apiUrl,
    version: WOAH_API_VERSION,
    sslVariables,
    useJson: true,
    cors: {
        origin,
        credentials: true,
    },
    routes: [chat, auth],
});
