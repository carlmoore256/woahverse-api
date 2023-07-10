import jwt, { JwtPayload, VerifyCallback } from "jsonwebtoken";
import { JWT_SECRET } from "../../definitions";
import { Request, Response, NextFunction } from "express";
import { Debug } from "../../utils/Debug";

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
                Debug.log(`Client attempted to access protected route with invalid token`)
                return res.sendStatus(403);
            }

            (req as RequestWithUser).user = { address: payload.address };
            next();
        });
    } else {
        Debug.log(`Client attempted to access protected route without authorization header`);
        res.sendStatus(401);
    }
}


export function authenticateJWTWithCookies(req : Request, res : Response, next : NextFunction) {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, JWT_SECRET, (err : any, payload : any) => {
            if (err) {
                return res.sendStatus(403);
            }

            (req as RequestWithUser).user = { address: payload.address };
            console.log("YOOOO " + (req as RequestWithUser).user.address);
            next();
        });
    } else {
        res.sendStatus(401);
    }
}