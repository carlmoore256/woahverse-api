import { Router, Handler } from 'express';
import { randomNonce } from '../../utils/general';
import { check, body, validationResult } from 'express-validator';
import { verifySignature } from '../../blockchain/eth-sig';
import { validationErrorHandler } from '../handlers/error-handler';
import jwt from 'jsonwebtoken';

const router = Router();

let NONCES : Map<string, string> = new Map();

const handleVerifyCookies : Handler = (req, res) => {
    const { address, signature, message } = req.body;
    if (NONCES.get(address) !== message) {
        res.status(400).send({ "error" : "Nonce does not match" });
        return;
    } else {
        NONCES.delete(address);
    }
    if (!verifySignature(signature, message, address)) {
        res.status(400).send({ "error" : "Signature verification failed" });
        return;
    }
    const token = jwt.sign({ address }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
    // Set the JWT as an httpOnly cookie
    res.cookie('token', token, { 
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 3600000 * 24 // 24 hours
    });

    res.status(200).send({ message: 'Authentication successful' });
    // res.send({ token });
}


const handleVerify : Handler = (req, res) => {
    const { address, signature, message } = req.body;
    if (NONCES.get(address) !== message) {
        res.status(400).send({ "error" : "Nonce does not match" });
        return;
    } else {
        NONCES.delete(address);
    }
    if (!verifySignature(signature, message, address)) {
        res.status(400).send({ "error" : "Signature verification failed" });
        return;
    }
    const token = jwt.sign({ address }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
    res.send({ token });
}


export default (parent : Router) => {

    parent.use("/auth", router);

    router.get("/nonce/:address", (req, res) => {
        const address = req.params.address;
        if (!address) {
            res.status(400).send({ "error" : "invalid-request" });
            return;
        }
        const nonce = randomNonce();
        const message = `Message to sign for woahverse chat. Nonce: ${nonce} Timestamp: ${new Date().toISOString()}`;
        NONCES.set(address, message);
        setTimeout(() => {
            if (NONCES.has(address)) NONCES.delete(address);
        }, 1000 * 60 * 5); // 5 minutes to sign or nonce expires
        res.send({ message });
    });

    router.post("/verify", 
        body('address')
            .notEmpty().withMessage('Address is required')
            .isEthereumAddress().withMessage("Address is not a valid ethereum address"),
        body('signature')
            .notEmpty().withMessage('Signature is required')
            .escape(),
        body('message')
            .notEmpty().withMessage('Message is required')
            .escape(),
        validationErrorHandler,
        handleVerify
    );

}