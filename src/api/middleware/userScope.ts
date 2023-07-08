import jwt from 'jsonwebtoken';
import { Handler } from 'express';

export function validateUser(requiredScopes : string[]) : Handler {
    return async (req, res, next) => {

        // const authHeader = req.headers.authorization;
        
        // if (authHeader) {
        //     const token = authHeader.split(' ')[1];
        //     try {
        //         const user = await DB.getUserById(jwt.verify(token, JWT_SECRET).id);
        //         if (user) {
        //             req.user = user;
        //             next();
        //         } else {
        //             res.sendStatus(403);
        //         }
        //     } catch (err) {
        //         res.sendStatus(403);
        //     }
        // } else {
        //     res.sendStatus(401);
        // }
        next();
    }
}