import { readFileSync, writeFileSync } from "fs";

export function isNullOrEmpty(s: string | null | undefined) {
    return s == null || s == undefined || s === "";
}
export function isNullOrNaN(v: number | null) {
    return v == null || isNaN(v);
}

export function shuffleArray(array: any[]) {
    return array.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

export function isSubsetObject(obj1 : any, obj2 : any) {
    for (let key in obj2) {
        if (!obj1.hasOwnProperty(key)) {
            return false;
        } else if (typeof obj2[key] === 'object' && obj2[key] !== null) {
            if (!isSubsetObject(obj1[key], obj2[key])) {
                return false;
            }
        } else if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}

export function randomVector(length: number): number[] {
    let vector: number[] = [];
    for (let i = 0; i < length; i++) {
        vector.push(Math.random());
    }
    return vector;
}

export function zeroVector(length : number): number[] {
    let vector: number[] = [];
    for (let i = 0; i < length; i++) {
        vector.push(0);
    }
    return vector;
}

export function randomNonce() {
    return Math.floor(Math.random() * 1000000000);
}

export function loadJSON<T>(path : string) {
    const data = readFileSync(path, { encoding: "utf8" });
    return JSON.parse(data) as T;
}

export function saveJSON(path : string, data : any) {
    writeFileSync(path, JSON.stringify(data, null, 2), { encoding: "utf8" });
}