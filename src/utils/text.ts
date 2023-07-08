export function hasSubstring(path : string, subpath : string) : boolean {
    return path.indexOf(subpath) !== -1;
}

export function hasAnySubstring(path : string, subpaths : string[]) : boolean {
    for (const subpath of subpaths) {
        if (hasSubstring(path, subpath)) {
            return true;
        }
    }
    return false;
}