
export enum LogColor {
    Red = '\x1b[31m%s\x1b[0m',
    Green = '\x1b[32m%s\x1b[0m',
    Yellow = '\x1b[33m%s\x1b[0m',
    Blue = '\x1b[34m%s\x1b[0m',
    Magenta = '\x1b[35m%s\x1b[0m',
    Cyan = '\x1b[36m%s\x1b[0m',
    White = '\x1b[37m%s\x1b[0m',
    BrightRed = '\x1b[91m%s\x1b[0m',
    BrightGreen = '\x1b[92m%s\x1b[0m',
    BrightYellow = '\x1b[93m%s\x1b[0m',
    BrightBlue = '\x1b[94m%s\x1b[0m',
    BrightMagenta = '\x1b[95m%s\x1b[0m',
    BrightCyan = '\x1b[96m%s\x1b[0m',
    BrightWhite = '\x1b[97m%s\x1b[0m',
}

export function logMessage(message : string, color : LogColor = LogColor.White) {
    console.log(color, message);
}
