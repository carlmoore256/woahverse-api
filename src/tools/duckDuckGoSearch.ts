import { spawn } from 'child_process';
import { Tool, ToolParams, DynamicTool } from "langchain/tools";
import { IToolCallback } from './IToolCallback';

type SafeSearchType = 'off' | 'moderate' | 'on';
const SAFESEARCH_DEFAULT : SafeSearchType = 'off';

// restrict search results to the last day, week, month, or year
type SearchDateRange = 'd' | 'w' | 'm' | 'y';

export interface SearchDuckDuckGoParams {
    // timeout?: number; // length of time until the search times out, and returns what has been given
    site?: string; // a specific website to query
    filetype?: string; // a specific filetype to query
    excludeSites?: string[]; // a list of sites to exclude
    excludeFiletypes?: string[]; // a list of filetypes to exclude
    region?: DDGSRegion; // a region to search from
    dateRange?: SearchDateRange; // restrict search results to the last day, week, month, or year
    maxResults?: number; // maximum number of results to return
}


// NOTE - currenlty this is NOT expose to langchain and only the source code can change these parameters
export const getSearchParametersDescription = () => {
    return `The following parameters can be used to customize the search, you can choose to use any combination of them: 
    timeout: length of time until the search times out, and returns what has been given
    site: a specific website to query
    filetype: a specific filetype to query
    excludeSites: a list of sites to exclude
    excludeFiletypes: a list of filetypes to exclude
    region: a region to search from
    dateRange: restrict search results to the last day, week, month, or year
    `
}




export function getDDGSTextSearchTool(name : string, description : string, timeout : number, params : SearchDuckDuckGoParams | null = null, callback : IToolCallback | null = null) : DynamicTool {
    return new DynamicTool({
        name,
        description,
        func: async (input : string) => {
            callback?.onInput?.(input);
            const res = await searchDuckDuckGo(input, timeout, params);
            callback?.onOutput?.(res);
            return res;
        }
    });
}



async function searchDuckDuckGo(input : string, timeout : number, params : SearchDuckDuckGoParams | null) : Promise<string> {
    return new Promise((resolve, reject) => {

        const args = ['text', '-k', input, '-s', SAFESEARCH_DEFAULT];
        
        if (params?.site) args.push(`site:${params.site}`);
        if (params?.dateRange) args.push(`-t`, params.dateRange);
        if (params?.filetype) args.push(`filetype:${params.filetype}`);
        if (params?.maxResults) args.push(`-m`, params.maxResults.toString());
        if (params?.excludeSites) args.push(params.excludeSites.map(s => `-${s}`).join(' '));
        
        let output = '';

        const ddgs = spawn('ddgs', ['text', '-k', input]);
        ddgs.stdout.on('data', data => output += data.toString());
        
        ddgs.stderr.on('data', data => {
            if (output.length > 0) resolve(output);
            else reject({data}) // consider making this into a string so the bot can understand it
        });
        
        ddgs.on('close', () => resolve(output));

        // sets the process to timeout, since there's no clear way of knowing if it has returned the full results or not
        setTimeout(() => {
            ddgs.kill();
            if (output.length > 0) { // if any output was received, resolve with it
                resolve(output);
            } else {
                reject("Request timed out, try another query or tool");
        }}, timeout);
    });
}

export class DDGSNewsSearchTool extends Tool {
    name = 'DDGSNewsSearch';
    description = 'News search using ddgs';

    async _call(arg: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const args = arg.split(' ');
            const ddgs = spawn('ddgs', ['news', '-k', ...args]);

            let output = '';
            ddgs.stdout.on('data', data => output += data);
            ddgs.stderr.on('data', data => reject(data));
            ddgs.on('close', () => resolve(output));
        });
    }
}

export class DDGSAnswersSearchTool extends Tool {
    name = 'DDGSAnswersSearch';
    description = 'Answers search using ddgs';

    async _call(arg: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const args = arg.split(' ');
            const ddgs = spawn('ddgs', ['answers', '-k', ...args]);

            let output = '';
            ddgs.stdout.on('data', data => output += data);
            ddgs.stderr.on('data', data => reject(data));
            ddgs.on('close', () => resolve(output));
        });
    }
}

export enum DDGSRegion {
    Arabia = "xa-ar",
    ArabiaEn = "xa-en",
    Argentina = "ar-es",
    Australia = "au-en",
    Austria = "at-de",
    BelgiumFr = "be-fr",
    BelgiumNl = "be-nl",
    Brazil = "br-pt",
    Bulgaria = "bg-bg",
    CanadaEn = "ca-en",
    CanadaFr = "ca-fr",
    Catalan = "ct-ca",
    Chile = "cl-es",
    China = "cn-zh",
    Colombia = "co-es",
    Croatia = "hr-hr",
    CzechRepublic = "cz-cs",
    Denmark = "dk-da",
    Estonia = "ee-et",
    Finland = "fi-fi",
    France = "fr-fr",
    Germany = "de-de",
    Greece = "gr-el",
    HongKong = "hk-tzh",
    Hungary = "hu-hu",
    India = "in-en",
    Indonesia = "id-id",
    IndonesiaEn = "id-en",
    Ireland = "ie-en",
    Israel = "il-he",
    Italy = "it-it",
    Japan = "jp-jp",
    Korea = "kr-kr",
    Latvia = "lv-lv",
    Lithuania = "lt-lt",
    LatinAmerica = "xl-es",
    Malaysia = "my-ms",
    MalaysiaEn = "my-en",
    Mexico = "mx-es",
    Netherlands = "nl-nl",
    NewZealand = "nz-en",
    Norway = "no-no",
    Peru = "pe-es",
    PhilippinesEn = "ph-en",
    PhilippinesTl = "ph-tl",
    Poland = "pl-pl",
    Portugal = "pt-pt",
    Romania = "ro-ro",
    Russia = "ru-ru",
    Singapore = "sg-en",
    SlovakRepublic = "sk-sk",
    Slovenia = "sl-sl",
    SouthAfrica = "za-en",
    Spain = "es-es",
    Sweden = "se-sv",
    SwitzerlandDe = "ch-de",
    SwitzerlandFr = "ch-fr",
    SwitzerlandIt = "ch-it",
    Taiwan = "tw-tzh",
    Thailand = "th-th",
    Turkey = "tr-tr",
    Ukraine = "ua-uk",
    UnitedKingdom = "uk-en",
    UnitedStates = "us-en",
    UnitedStatesEs = "ue-es",
    Venezuela = "ve-es",
    Vietnam = "vn-vi",
    NoRegion = "wt-wt",
}

export const AvailableDDGSRegions = () : string[] => {
    return Object.keys(DDGSRegion)
}
