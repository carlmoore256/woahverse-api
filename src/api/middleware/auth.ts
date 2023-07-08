import * as dotenv from "dotenv";
import {Handler} from "express";
import {constants as httpConstants} from "http2";
import {isNullOrEmpty} from "../../utils/general";


dotenv.config();

const TOKEN_HEADER_NAME = "Authorization";

/** require a request to have some specific header or else send back 403 */
export function RequireHeader(headerName: string, headerValue: string): Handler {
    return (req, res, next) => {
        const value = req.header(headerName);
        if (isNullOrEmpty(value) || value !== headerValue) {
            console.log("missing required header!");
            res.status(httpConstants.HTTP_STATUS_FORBIDDEN).send();
            return;
        }
        next();
    }
}

/** 
 * require request to have a valid bearer token,
 * subsequent request handlers will have the IdTokenData available to them via req.token
 */
// export function JWTCheck(...requiredScopes: string[]): Handler {
//     return (req, res, next) => {
//         const tokenRaw = req.header(TOKEN_HEADER_NAME)?.split(" ")[1] ?? "";
//         if (tokenRaw === "") {
//             console.log(`missing ${TOKEN_HEADER_NAME} header`);
//             res.status(httpConstants.HTTP_STATUS_FORBIDDEN).send();
//             return;
//         }
//         // const tokenValue = (Buffer.from(tokenRaw, "base64")).toString();
//         const tokenValue = tokenRaw;
//         let hasAllScopes = false;
//         try {
//             req.token = JWT.verify(tokenValue) as User.IdTokenData;
            
//             for(const scope of requiredScopes) {
//                 console.log(scope)
//                 // const authenticated = false;
//                 if (!req.token.scopes.includes(scope)) {
//                     console.log(`user should have ${scope} but they simply don't! they have(${req.token.scopes.join(",")})`)
//                     hasAllScopes = false;
//                     break;
//                 }
//             }
//             if (!hasAllScopes) {
//                 res.status(httpConstants.HTTP_STATUS_FORBIDDEN);
//                 res.send();
//                 return;
//             }
//             next();
//         } catch (err) {
//             console.log(`jwt.verify failure'`);
//             next(err);
//         }
//     }
// }

// if (!req.token.roles.includes(role)) {
//     console.log(`user should have ${role} but they simply don't! they have(${req.token.roles.join(",")})`)
//     res.status(httpConstants.HTTP_STATUS_FORBIDDEN);
//     res.send();
//     return;
// }