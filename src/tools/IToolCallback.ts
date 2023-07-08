export interface IToolCallback {
    id: string;
    onInput? : (input : string) => void;
    onOutput? : (input : string) => void;
}