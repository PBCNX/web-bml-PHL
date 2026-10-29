export type NvramAreaSizing = {
    /** Bytes for the affiliation and broadcaster areas. Omitted keeps the table's own size (64). */
    areaBytes?: number;
    /** Bytes for the affiliation "group" area specifically (wins over `areaBytes`). */
    affiliationBytes?: number;
    /** Bytes for the broadcaster "local" area specifically (wins over `areaBytes`). */
    broadcasterBytes?: number;
};
/** The areas the standard sizes in kilobytes, by their URI prefix. */
export declare const SIZED_AREA_PREFIXES: readonly ["group", "local"];
export declare function areaBytesFor(prefix: string, sizing: NvramAreaSizing, current: number): number;
/** The PH profile's sizing: 4 KB for the affiliation and 4 KB for the broadcaster. */
export declare function phAreaSizing(): NvramAreaSizing;
//# sourceMappingURL=nvram_sizing.d.ts.map