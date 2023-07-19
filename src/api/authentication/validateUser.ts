import { JWT_SECRET } from '../../definitions';
import bcrypt from 'bcrypt';
import DatabaseClient from '../../database/DatabaseClient';
// import { IUser } from '../../database/types';
import jwt from 'jsonwebtoken';
import { IUser } from '../../database/types/IUser';

export function validateUserPassword(username : string, password : string) : Promise<any> {
    return new Promise(async (resolve, reject) => {
        const user = await DatabaseClient.Instance.getUser(username);
        if (!user) {
            reject("Invalid username or password");
            return;
        }
        const validPassword = bcrypt.compareSync(password, user.password);

        if (validPassword) {
            resolve(user);
        } else {
            reject("Invalid username or password");
        }
    });
}

export function trySignToken(username : string, password : string) : Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await validateUserPassword(username, password);
            const token = jwt.sign({ id : user.id }, JWT_SECRET);
            resolve(token);
        } catch (err) {
            reject(err);
        }
    });
}

export function isValidUser(username : string) : Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await DatabaseClient.Instance.getUser(username);
            resolve(user !== undefined);
        } catch (err) {
            reject(err);
        }
    });
}