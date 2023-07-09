import { RESTApp } from "./RESTApp";
import { WOAH_API_URL, WOAH_API_VERSION, WOAH_PORT } from "../definitions";
import chat from './routes/chat';
import auth from './routes/auth';

export default new RESTApp({
    name: "Woahverse",
    port: WOAH_PORT,
    apiUrl: WOAH_API_URL,
    version: WOAH_API_VERSION,
    sslVariables: {
        key: "WOAHVERSE_SSL_KEY",
        cert: "WOAHVERSE_SSL_CERT"
    },
    useJson: true,
    useCors: true,
    routes: [chat, auth]
});