import { bufferToHex, toChecksumAddress } from "ethereumjs-util";
import { recoverPersonalSignature } from "@metamask/eth-sig-util";

export function recoverAddress(signature : string, message : string) {
    const msgBufferHex = bufferToHex(Buffer.from(message, 'utf8'));
    const address = recoverPersonalSignature({
        data: msgBufferHex,
        signature
    });
    return toChecksumAddress(address);
}


export function verifySignature(signature : string, message : string, address : string) {
    return recoverAddress(signature, message) === toChecksumAddress(address);
}
