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
/**
 * 2.6.0: the three receiver-info fields for an area code, as one set.
 *
 * PH: `regioncode` carries the 12-bit code, `prefecture` is 255 (unset) and `zipcode` is empty. null
 * and 0 both clear the code; the other two fields are set the same way, so "cleared" is still a PH set
 * and never a leftover Japanese postal code.
 */
export declare function receiverAreaCodeSet(code: number | null | undefined): {
    regionCode: Uint8Array;
    prefecture: Uint8Array;
    zipcode: Uint8Array;
};
/**
 * 3.1.x: the Japanese receiver-info set for one location, or null when the input cannot be one.
 *
 * `postcode` is the 7-digit ARIB postal field (one byte per digit; separators are ignored, so
 * "135-0047" is accepted). `prefecture` is 1-47, or 255 for unset. `japanLocationCode` is the 12-bit
 * code a JP host keeps in `regioncode`; when it is omitted the field is written as **0**, which is what
 * keeps a Japanese set from carrying a stale Philippine code.
 */
export declare function receiverPostalCodeSet(postcode: string, prefecture: number, japanLocationCode?: number | null): {
    regionCode: Uint8Array;
    prefecture: Uint8Array;
    zipcode: Uint8Array;
} | null;
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
     * it as an open question in the profile) and it defines no other viewer-location field. TVTest-PHL
     * writes the 12-bit PH code there for a PH stream; `0` (or no value) means unset.
     *
     * The transport stays NVRAM, so a page can still read the raw field; this is the friendly surface.
     */
    getReceiverAreaCode(): number | null;
    /**
     * 2.6.0: a host sets the viewer's Philippine area code, as one receiver-info set.
     *
     * `code` is the 12-bit PH area code, or null/0 to clear. The three fields are written together —
     * `regioncode` (2 bytes, big-endian, low 12 bits), `prefecture` 255 and `zipcode` empty — because a
     * PH code with Japanese postal fields is exactly the mixed state the convention forbids. Nothing is
     * written when the stored set already matches, since a host calls this at every session start and
     * NVRAM wear is a real constraint.
     *
     * Returns true when something was written.
     */
    setReceiverAreaCode(code: number | null): boolean;
    /**
     * 3.1.x: the Japanese receiver-location set — the postal code and prefecture a JP page's locator
     * reads, plus the 12-bit code a JP host keeps in `regioncode`.
     *
     * The counterpart of `setReceiverAreaCode`, and the two are profile-exclusive: whichever is called
     * last leaves a coherent set, because this one writes `regioncode` **0** when the caller supplies no
     * Japanese code. A JP set therefore cannot leave a stale PH code behind, and a PH set writes an
     * empty `zipcode` (see `receiverAreaCodeSet`).
     *
     * Only the fields that differ are written, so the no-op discipline is per field: a page's own
     * `zipcode` write survives only while the host's value is the same one it last asserted.
     *
     * Returns true when something was written. Refuses (false, logged) a postal code that is not 7
     * digits or a prefecture outside 1-47 / 255.
     */
    setReceiverPostalCode(postcode: string, prefecture: number, japanLocationCode?: number | null): boolean;
    /**
     * 3.1.x: what the Japanese location fields hold, or null when the set is not a Japanese one (the
     * PH set writes zeroed postal fields, so a PH-configured receiver answers null here).
     */
    getReceiverPostalCode(): {
        postcode: string;
        prefecture: number;
        japanLocationCode: number | null;
    } | null;
    /**
     * Write the receiver-info set, field by field, skipping what already matches. These fields are the
     * host's to set (forced; TR-B14 5.2.7), and a page may write its own zipcode, so an unchanged field
     * is left exactly as it is.
     */
    private writeReceiverInfoSet;
    readPersistentArray(filename: string, structure: string): any[] | null;
    writePersistentArray(filename: string, structure: string, data: any[], period?: Date, force?: boolean): number;
    private providerAreaPermission;
    cspSetAccessInfoToProviderArea(data: Uint8Array): boolean;
    readPersistentArrayWithAccessCheck(filename: string, structure: string): any[] | null;
    writePersistentArrayWithAccessCheck(filename: string, structure: string, data: any[], period?: Date): number;
    checkAccessInfoOfPersistentArray(uri: string): number;
}
//# sourceMappingURL=nvram.d.ts.map