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
    cors: {
        origin: [
            'http://127.0.0.1:5500', 
            'http://localhost:1234', 
            'https://carlmoorexyz-dev.web.app', 
            'https://woahverse.com'
        ],
        credentials: true
    },
    routes: [chat, auth]
});