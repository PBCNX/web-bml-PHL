import { BroadcasterDatabase } from "../broadcast/broadcaster_database";
import { Resources } from "../resource";
import { type Logger } from "../util/logger";
import { type NvramAreaSizing } from "./nvram_sizing";
/**
 * 2.5.0: the 12-bit area code out of the two bytes of `nvram://receiverinfo/regioncode`.
 *
 * The field is big-endian (`MJD`-style SI) and only the low 12 bits are the PH allocation; `0` and an
 * absent value both mean "unset", which the caller turns into `null`.
 */
export declare function regionCodeFromBytes(bytes: Uint8Array | null | undefined): number | null;
export declare class NVRAM {
    private readonly resources;
    private readonly broadcasterDatabase;
    private readonly logger;
    private readonly prefix;
    private readonly sizing;
    constructor(resources: Resources, broadcasterDatabase: BroadcasterDatabase, logger: Logger, prefix?: string, sizing?: NvramAreaSizing);
    private getBroadcasterInfo;
    private findNvramArea;
    /**
     * Appends the affiliation_id the area scopes to, enforcing the broadcaster's affiliation list.
     * Returns false when the value is missing or not permitted, which the caller turns into a null key.
     */
    private appendAffiliationId;
    /**
     * Appends the broadcaster's own original_network_id.
     * Returns false when the receiver does not know it, for the same reason as the affiliation check.
     */
    private appendOriginalNetworkId;
    /**
     * Appends original_network_id only when the broadcaster owns the id the area asks for.
     * Returns false on denial; the 系列内共通 (0x0000-0x0003) ids bypass this check at the call site.
     */
    private appendOriginalNetworkIdChecked;
    /** The tuned broadcast type, which selects the permission column of every NVRAM area. */
    private get broadcastType();
    private areaPermission;
    private getLocalStorageKey;
    private readNVRAM;
    private writeNVRAM;
    /**
     * 2.5.0: the viewer's Philippine EWBS area code, from `nvram://receiverinfo/regioncode`.
     *
     * PBCNX extension (0). In TR38 that field **is** a 12-bit area code — the Japanese use is an area
     * code too — but the PH profile never mapped its own allocation onto it (the standards guide holds
     * it as `the profile rule`, status unknown) and it defines no other viewer-location field. TVTest-PHL
     * writes the 12-bit PH code there for a PH stream; `0` (or no value) means unset.
     *
     * The transport stays NVRAM, so a page can still read the raw field; this is the friendly surface.
     */
    getReceiverAreaCode(): number | null;
    readPersistentArray(filename: string, structure: string): any[] | null;
    writePersistentArray(filename: string, structure: string, data: any[], period?: Date, force?: boolean): number;
    private providerAreaPermission;
    cspSetAccessInfoToProviderArea(data: Uint8Array): boolean;
    readPersistentArrayWithAccessCheck(filename: string, structure: string): any[] | null;
    writePersistentArrayWithAccessCheck(filename: string, structure: string, data: any[], period?: Date): number;
    checkAccessInfoOfPersistentArray(uri: string): number;
}
//# sourceMappingURL=nvram.d.ts.map