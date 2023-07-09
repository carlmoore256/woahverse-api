import jwt, { JwtPayload, VerifyCallback } from "jsonwebtoken";
import { JWT_SECRET } from "../../definitions";
import { Request, Response, NextFunction } from "express";

export interface RequestWithUser extends Request {
    user: {
      address: string;
    };
  }
  


export function authenticateJWT(req : Request, res : Response, next : NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err : any, payload : any) => {
            if (err) {
                return res.sendStatus(403);
            }

            // req.user = user;
            (req as RequestWithUser).user = { address: payload.address };

            next();
        });
    } else {
        res.sendStatus(401);
    }
}

// export function signJWT(id : string) {
//     return jwt.sign({ id }, JWT_SECRET, {
//         expiresIn: '24h'
//     });
// }