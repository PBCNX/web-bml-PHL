// /documents/nvram.md参照
import { BinaryTableType, parseBinaryStructure, readBinaryFields, writeBinaryFields } from "./binary_table";
import { BroadcasterDatabase } from "../broadcast/broadcaster_database";
import { Resources } from "../resource";
import { Profile } from "../profile";
import { getTextDecoder, getTextEncoder } from "../text";
import { broadcastWallClockToUnixMillis } from "../time_offset";
import { type Logger } from "../util/logger";
import { areaBytesFor, type NvramAreaSizing } from "./nvram_sizing";

type NvramAccessId =
    "broadcaster_id" | // 事業者ごと(BSとCS)
    "original_network_id" | // ネットワークごと(地上波とCS)
    "affiliation_id" | // 系列ごと(地上波)
    "affiliation_id;original_network_id" // 系列+ネットワークごと(地上波Cプロファイル)
    ;

type NvramPermission = "" | "r" | "rw";

type BroadcastType = "GR" | "BS" | "CS";

type NvramArea = {
    broadcastType: BroadcastType,
    // nvram://id;aaa/bbb/<block number>
    //         ~~ここ
    prefixId: NvramAccessId | null,
    // nvram://aaa/bbb/<block number>
    //         ~~~~~~~ここ
    prefix: string,
    startBlock: number,
    lastBlock: number,
    // 大きさ(バイト)
    size: number,
    // 固定領域
    isFixed: boolean,
    // 事業者ごとに保存されるといった情報
    // 共通であれば[]
    accessId: NvramAccessId[],
    // nvrams://
    isSecure: boolean,
    permissions: { [broadcastType in BroadcastType]: NvramPermission },
};

const nvramAreas: NvramArea[] = [
    // 地上波
    // 地上デジタルテレビジョン放送事業者系列専用領域
    {
        broadcastType: "GR",
        prefixId: "affiliation_id",
        prefix: "group",
        startBlock: 0,
        lastBlock: 63,
        size: 64,
        isFixed: true,
        accessId: ["affiliation_id"],
        permissions: {
            "GR": "rw",
            "BS": "rw",
            "CS": "",
        },
        isSecure: false,
    },
    // 地上デジタルテレビジョン放送事業者専用領域
    {
        broadcastType: "GR",
        prefixId: null,
        prefix: "local",
        startBlock: 0,
        lastBlock: 63,
        size: 64,
        isFixed: true,
        accessId: ["original_network_id"],
        permissions: {
            "GR": "rw",
            "BS": "",
            "CS": "",
        },
        isSecure: false,
    },
    // 地上デジタルテレビジョン放送事業者専用放送通信共通領域
    {
        broadcastType: "GR",
        prefixId: null,
        prefix: "local_web",
        startBlock: 0,
        lastBlock: 31,
        size: 64,
        isFixed: true,
        accessId: ["original_network_id"],
        permissions: {
            "GR": "rw",
            "BS": "",
            "CS": "",
        },
        isSecure: false,
    },
    // 地上デジタルテレビジョン放送事業者共通領域
    {
        broadcastType: "GR",
        prefixId: null,
        prefix: "tr_common",
        startBlock: 0,
        lastBlock: 31,
        size: 64,
        isFixed: true,
        accessId: [],
        permissions: {
            "GR": "rw",
            "BS": "r",
            "CS": "",
        },
        isSecure: false,
    },
    // 地上デジタルテレビジョンCプロファイル放送事業者系列領域
    {
        broadcastType: "GR",
        prefixId: null,
        prefix: "Cprogroup",
        startBlock: 0,
        lastBlock: 31,
        size: 64,
        isFixed: true,
        accessId: ["affiliation_id;original_network_id"],
        permissions: {
            "GR": "rw",
            "BS": "",
            "CS": "",
        },
        isSecure: false,
    },
    // BS事業者共通領域
    {
        broadcastType: "BS",
        prefixId: null,
        prefix: "common",
        startBlock: 0,
        lastBlock: 15,
        size: 64,
        isFixed: true,
        accessId: [],
        permissions: {
            "GR": "r",
            "BS": "rw",
            "CS": "",
        },
        isSecure: false,
    },
    // BS事業者専用領域
    {
        broadcastType: "BS",
        prefixId: null,
        prefix: "~",
        startBlock: 0,
        lastBlock: 15,
        size: 64,
        isFixed: true,
        accessId: ["broadcaster_id"],
        permissions: {
            "GR": "",
            "BS": "rw",
            "CS": "rw",
        },
        isSecure: false,
    },
    // BS事業者専用領域
    {
        broadcastType: "BS",
        prefixId: null,
        prefix: "~/ext",
        startBlock: 16,
        lastBlock: 63,
        size: 64,
        isFixed: true,
        accessId: ["broadcaster_id"],
        permissions: {
            "GR": "",
            "BS": "rw",
            "CS": "rw",
        },
        isSecure: false,
    },
    // BSデジタル放送事業者専用放送通信共通領域
    {
        broadcastType: "BS",
        prefixId: null,
        prefix: "local_web",
        startBlock: 0,
        lastBlock: 31,
        size: 64,
        isFixed: true,
        accessId: ["broadcaster_id"],
        permissions: {
            "GR": "",
            "BS": "rw",
            "CS": "",
        },
        isSecure: false,
    },
    // 広帯域CSデジタル放送事業者共通領域
    {
        broadcastType: "CS",
        prefixId: null,
        prefix: "cs_common",
        startBlock: 0,
        lastBlock: 31,
        size: 64,
        isFixed: true,
        accessId: [],
        permissions: {
            // documents/nvram.md: BS 不可, CS 読み書き, 地上 不可
            "GR": "",
            "BS": "",
            "CS": "rw",
        },
        isSecure: false,
    },
    // 広帯域CSデジタル放送事業者専用領域
    {
        broadcastType: "CS",
        prefixId: null,
        prefix: "~",
        startBlock: 0,
        lastBlock: 46,
        size: 64,
        isFixed: true,
        accessId: ["original_network_id", "broadcaster_id"],
        permissions: {
            // documents/nvram.md: BS 不可, CS 読み書き, 地上 不可
            "GR": "",
            "BS": "",
            "CS": "rw",
        },
        isSecure: true,
    },
    // 広帯域CSデジタル放送事業者専用放送通信共通領域
    {
        broadcastType: "CS",
        prefixId: null,
        prefix: "local_web",
        startBlock: 0,
        lastBlock: 15,
        size: 64,
        isFixed: true,
        accessId: ["broadcaster_id"],
        permissions: {
            "GR": "",
            "BS": "",
            "CS": "rw",
        },
        isSecure: false,
    },
];

// nullは不明
type BroadcasterInfo = {
    affiliationId?: number[] | null,
    originalNetworkId?: number | null,
    broadcasterId?: number | null,
    broadcastType?: BroadcastType | null,
    serviceId?: number | null,
};

type AccessInfo = {
    affiliationId?: number | null,
    originalNetworkId?: number | null,
    broadcasterId?: number | null,
    broadcastType?: BroadcastType | null,
    block?: number | null,
};


export class NVRAM {
    private readonly resources: Resources;
    private readonly broadcasterDatabase: BroadcasterDatabase;
    private readonly logger: Logger;
    private readonly prefix: string;
    private readonly sizing: NvramAreaSizing;
    constructor(resources: Resources, broadcasterDatabase: BroadcasterDatabase, logger: Logger, prefix?: string, sizing: NvramAreaSizing = {}) {
        this.resources = resources;
        this.broadcasterDatabase = broadcasterDatabase;
        this.logger = logger;
        this.prefix = prefix ?? "nvram_";
        this.sizing = sizing;
    }

    private getBroadcasterInfo(): BroadcasterInfo {
        const bid = this.broadcasterDatabase.getBroadcasterId(this.resources.originalNetworkId, this.resources.serviceId);
        return {
            originalNetworkId: this.resources.originalNetworkId,
            affiliationId: this.broadcasterDatabase.getAffiliationIdList(this.resources.originalNetworkId, bid),
            broadcasterId: bid,
            // The same prefix exists once per broadcast type (local_web/GR, /BS, /CS), so the row
            // that governs this receiver is chosen by this value.
            broadcastType: this.broadcastType,
            serviceId: this.resources.serviceId,
        };
    }

    private findNvramArea(url: string, broadcasterInfo: BroadcasterInfo): [AccessInfo, NvramArea] | null {
        // Real pages write the affiliation as a path segment as well as with the standard separator:
        // BS-TBS emits `nvram:///03/group/30` (03 = TBS affiliation) where the grammar says
        // `nvram://03;group/30`. Normalise the path form before parsing, or the area is "unknown".
        const normalized = url.replace(/^(nvrams?:\/\/)\/([0-9a-fA-F]{2})\//, "$1$2;");
        const match = normalized.match(/^nvrams?:\/\/((?<affiliationId>[0-9a-fA-F]{2});)?((?<originalNetworkId>[0-9a-fA-F]{4});)?(?<prefix>.+)\/(?<block>\d+)$/);
        if (!match?.groups) {
            return null;
        }
        const isSecure = url.startsWith("nvrams://");
        let affiliationId: number | null = parseInt(match?.groups.affiliationId, 16);
        if (!Number.isFinite(affiliationId)) {
            affiliationId = null;
        }
        let originalNetworkId: number | null = parseInt(match?.groups.originalNetworkId, 16);
        if (!Number.isFinite(originalNetworkId)) {
            originalNetworkId = null;
        }
        const prefix = match?.groups.prefix;
        const block = Number.parseInt(match?.groups.block ?? "", 10);
        if (!Number.isFinite(block)) {
            return null;
        }
        for (const area of nvramAreas) {
            // The row that governs this receiver is the one whose permissions name it: `local_web`
            // carries one row per broadcast type, while `group` carries one row that grants GR and BS
            // ("rw" each) and denies CS. Comparing area.broadcastType instead hid `group` from BS -
            // BS-TBS reads nvram:///03/group/30 and got "no such area".
            if (prefix === area.prefix && area.isSecure === isSecure && area.permissions[this.broadcastType] !== "") {
                if (area.startBlock <= block && area.lastBlock >= block) {
                    return [
                        { block, affiliationId, originalNetworkId, broadcasterId: broadcasterInfo.broadcasterId, broadcastType: broadcasterInfo.broadcastType },
                        // C15: the PH profile sizes the affiliation and broadcaster areas at 4 KB; the
                        // table's own 64 bytes are the Japanese sizing.
                        { ...area, size: areaBytesFor(area.prefix, this.sizing, area.size) },
                    ];
                }
            }
        }
        return null;
    }

    /**
     * Appends the affiliation_id the area scopes to, enforcing the broadcaster's affiliation list.
     * Returns false when the value is missing or not permitted, which the caller turns into a null key.
     */
    private appendAffiliationId(params: URLSearchParams, broadcasterInfo: BroadcasterInfo, accessInfo: AccessInfo): boolean {
        if (broadcasterInfo.affiliationId == null) {
            // The receiver does not know its own affiliation, so it cannot grant anything: failing
            // open here would let the caller's claimed id decide the key.
            this.logger.error(`affiliationId == null!`);
            return false;
        }
        if (accessInfo.affiliationId == null) {
            this.logger.error(`affiliationId == null!`, accessInfo);
            return false;
        }
        if (broadcasterInfo.affiliationId.includes(accessInfo.affiliationId)) {
            params.append("affiliation_id", String(accessInfo.affiliationId));
            return true;
        }
        this.logger.error(`permission denied (affiliationId)`, broadcasterInfo.affiliationId, accessInfo.affiliationId);
        return false;
    }

    /**
     * Appends the broadcaster's own original_network_id.
     * Returns false when the receiver does not know it, for the same reason as the affiliation check.
     */
    private appendOriginalNetworkId(params: URLSearchParams, broadcasterInfo: BroadcasterInfo): boolean {
        if (broadcasterInfo.originalNetworkId == null) {
            this.logger.error(`originalNetworkId == null!`);
            return false;
        }
        params.append("original_network_id", String(broadcasterInfo.originalNetworkId));
        return true;
    }

    /**
     * Appends original_network_id only when the broadcaster owns the id the area asks for.
     * Returns false on denial; the 系列内共通 (0x0000-0x0003) ids bypass this check at the call site.
     */
    private appendOriginalNetworkIdChecked(params: URLSearchParams, broadcasterInfo: BroadcasterInfo, accessInfo: AccessInfo): boolean {
        if (broadcasterInfo.originalNetworkId == null) {
            this.logger.error(`originalNetworkId == null!`);
            return false;
        }
        // accessInfo.originalNetworkId is already known non-null here: the caller's `invalid` guard
        // rejects a request without one before this runs.
        if (broadcasterInfo.originalNetworkId === accessInfo.originalNetworkId) {
            params.append("original_network_id", String(accessInfo.originalNetworkId));
            return true;
        }
        this.logger.error(`permission denied (original_network_id)`, broadcasterInfo.originalNetworkId, accessInfo.originalNetworkId);
        return false;
    }

    /** The tuned broadcast type, which selects the permission column of every NVRAM area. */
    private get broadcastType(): BroadcastType {
        switch (this.resources.profile) {
            case Profile.BS:
                return "BS";
            case Profile.CS:
                return "CS";
            default:
                return "GR";
        }
    }

    private areaPermission(nvramArea: NvramArea): NvramPermission {
        return nvramArea.permissions[this.broadcastType];
    }

    private getLocalStorageKey(broadcasterInfo: BroadcasterInfo, accessInfo: AccessInfo, nvramArea: NvramArea, direction: "read" | "write"): string | null {
        const permission = this.areaPermission(nvramArea);
        // The area's table declares per-broadcast-type access; a write needs "rw", a read needs
        // "r" or "rw". Applying it here covers every caller, not just the navigation path.
        if (direction === "write" ? permission !== "rw" : permission === "") {
            this.logger.error(`permission denied (area)`, nvramArea.prefix, this.broadcastType, direction);
            return null;
        }
        const params = new URLSearchParams();
        for (const a of nvramArea.accessId) {
            if (a === "affiliation_id") {
                if (!this.appendAffiliationId(params, broadcasterInfo, accessInfo)) {
                    return null;
                }
            } else if (a === "broadcaster_id") {
                if (accessInfo.broadcasterId == null) {
                    this.logger.error(`broadcasterId == null!`);
                    params.append("broadcaster_id", "null");
                } else {
                    params.append("broadcaster_id", String(accessInfo.broadcasterId));
                }
            } else if (a === "original_network_id") {
                if (!this.appendOriginalNetworkId(params, broadcasterInfo)) {
                    return null;
                }
            } else if (a === "affiliation_id;original_network_id") {
                if (accessInfo.affiliationId == null || accessInfo.originalNetworkId == null) {
                    this.logger.error(`invalid`, accessInfo);
                    return null;
                }
                if (accessInfo.originalNetworkId <= 0x0003) {
                    // 系列内共通領域 (0x0000-0x0003; the id is unsigned, so a lower bound is vacuous)
                    params.append("original_network_id", String(accessInfo.originalNetworkId));
                    params.append("affiliation_id", String(accessInfo.affiliationId));
                } else if (!this.appendOriginalNetworkIdChecked(params, broadcasterInfo, accessInfo)
                    || !this.appendAffiliationId(params, broadcasterInfo, accessInfo)) {
                    return null;
                }
            } else {
                ((_: never) => { })(a);
            }
        }
        params.append("prefix", nvramArea.prefix);
        if (accessInfo.block != null) {
            params.append("block", String(accessInfo.block));
        }
        if (nvramArea.isSecure) {
            params.append("secure", "true");
            const key = `${broadcasterInfo.originalNetworkId}.${broadcasterInfo.broadcasterId}`;
            const blockPermission = this.providerAreaPermission.get(key);
            if (blockPermission == null) {
                this.logger.error(`permission not set (nvrams)`);
                return null;
            }
            if (accessInfo.block != null) {
                const allowedServiceId = blockPermission.serviceIdList[accessInfo.block];
                if (allowedServiceId !== 0xffff && allowedServiceId !== broadcasterInfo.serviceId) {
                    this.logger.error(`permission denied (nvrams serviceId)`, allowedServiceId, broadcasterInfo.serviceId);
                    return null;
                }
            }
        }
        return params.toString();
    }

    private readNVRAM(uri: string): Uint8Array | null {
        let strg: string | null;
        let isFixed: boolean;
        let size: number;
        if (uri === "nvram://receiverinfo/zipcode") {
            strg = localStorage.getItem(this.prefix + "prefix=receiverinfo%2Fzipcode");
            isFixed = true;
            size = 7;
        } else if (uri === "nvram://receiverinfo/prefecture") {
            strg = localStorage.getItem(this.prefix + "prefix=receiverinfo%2Fprefecture");
            if (strg == null || strg.length === 0) {
                strg = window.btoa(String.fromCharCode(255));
            }
            isFixed = true;
            size = 1;
        } else if (uri === "nvram://receiverinfo/regioncode") {
            strg = localStorage.getItem(this.prefix + "prefix=receiverinfo%2Fregioncode");
            if (strg == null || strg.length === 0) {
                strg = window.btoa(String.fromCharCode(0) + String.fromCharCode(0));
            }
            isFixed = true;
            size = 2;
        } else {
            const binfo = this.getBroadcasterInfo();
            const result = this.findNvramArea(uri, binfo);
            if (!result) {
                this.logger.error(`readNVRAM: findNvramArea failed`, uri);
                return null;
            }
            const [id, area] = result;
            const k = this.getLocalStorageKey(binfo, id, area, "read");
            if (!k) {
                this.logger.error(`readNVRAM: access denied`, uri);
                return null;
            }
            strg = localStorage.getItem(this.prefix + k);
            if (strg != null && area.isSecure) {
                const serviceId = Number.parseInt(strg.split(",")[0]);
                // 更新時に異なるs_idの時はブロック内データを初期化（内部動作）?
                if (serviceId !== 0xffff && serviceId !== binfo.serviceId) {
                    strg = "";
                } else {
                    strg = strg.split(",")[1] ?? "";
                }
            }
            isFixed = area.isFixed;
            size = area.size;
        }
        if (!strg) {
            return new Uint8Array(isFixed ? size : 0);
        }
        // A corrupt stored value must not throw: the callers declared a contract of null/empty.
        // atob threw URIError-style failures on any non-base64 character.
        let a: Uint8Array;
        try {
            a = Uint8Array.from(window.atob(strg), c => c.charCodeAt(0));
        } catch (caughtError) {
            this.logger.error(`stored NVRAM value is not valid base64`, caughtError);
            return new Uint8Array(isFixed ? size : 0);
        }
        if (isFixed) {
            if (a.length > size) {
                return a.subarray(0, size);
            } else if (a.length < size) {
                const fixed = new Uint8Array(size);
                fixed.set(a);
                return fixed;
            }
        }
        return a;
    }

    private writeNVRAM(uri: string, data: Uint8Array, force: boolean): number {
        // 書き込めない (TR-B14 第二分冊 5.2.7 表5-2参照)
        if (uri === "nvram://receiverinfo/prefecture") {
            if (!force) {
                return NaN;
            }
            localStorage.setItem(this.prefix + "prefix=receiverinfo%2Fprefecture", window.btoa(String.fromCharCode(...data).substring(0, 1)));
            return data.length;
        } else if (uri === "nvram://receiverinfo/regioncode") {
            if (!force) {
                return NaN;
            }
            localStorage.setItem(this.prefix + "prefix=receiverinfo%2Fregioncode", window.btoa(String.fromCharCode(...data).substring(0, 2)));
            return data.length;
            // 書き込める (TR-B14 第二分冊 5.2.7 表5-2参照)
        } else if (uri === "nvram://receiverinfo/zipcode") {
            localStorage.setItem(this.prefix + "prefix=receiverinfo%2Fzipcode", window.btoa(String.fromCharCode(...data).substring(0, 7)));
            return data.length;
        }
        const binfo = this.getBroadcasterInfo();
        const result = this.findNvramArea(uri, binfo);
        if (!result) {
            this.logger.error(`writeNVRAM: findNvramArea failed`, uri);
            return NaN;
        }
        const [id, area] = result;
        if (area.isFixed) {
            if (data.length > area.size) {
                this.logger.error(`writeNVRAM: too large data`, uri, data.length, area);
                return NaN;
            }
        }
        const k = this.getLocalStorageKey(binfo, id, area, "write");
        if (!k) {
            this.logger.error(`writeNVRAM: access denied`, uri);
            return NaN;
        }
        if (area.isSecure && id.block != null) {
            const key = `${binfo.originalNetworkId}.${binfo.broadcasterId}`;
            const blockPermission = this.providerAreaPermission.get(key);
            const allowedServiceId = blockPermission?.serviceIdList[id.block];
            localStorage.setItem(this.prefix + k, allowedServiceId + "," + window.btoa(String.fromCharCode(...data)));
        } else {
            localStorage.setItem(this.prefix + k, window.btoa(String.fromCharCode(...data)));
        }
        return data.length;
    }

    public readPersistentArray(filename: string, structure: string): any[] | null {
        if (!filename?.startsWith("nvram://")) {
            return null;
        }
        const fields = parseBinaryStructure(structure);
        if (!fields) {
            return null;
        }
        const a = this.readNVRAM(filename);
        if (!a) {
            return null;
        }
        try {
            const [result] = readBinaryFields(a, fields, getTextDecoder(this.resources.profile));
            return result;
        } catch (caughtError) {
            // 不正な構造や保存データは BML 側へ例外を漏らさず null で通知する
            this.logger.error(`readPersistentArray: failed to decode data`, filename, caughtError);
            return null;
        }
    }

    public writePersistentArray(filename: string, structure: string, data: any[], period?: Date, force?: boolean): number {
        if (!filename?.startsWith("nvram://")) {
            return NaN;
        }
        const fields = parseBinaryStructure(structure);
        if (!fields) {
            return NaN;
        }
        const dataFieldCount = fields.filter(field => field.type !== BinaryTableType.Pad).length;
        if (dataFieldCount > data.length) {
            this.logger.error(`writePersistentArray: dataFieldCount > data.length`);
            return NaN;
        }
        try {
            const bin = writeBinaryFields(data, fields, getTextEncoder(this.resources.profile));
            return this.writeNVRAM(filename, bin, force ?? false);
        } catch (caughtError) {
            // エンコードや保存の失敗は BML 側へ例外を漏らさず NaN で通知する
            this.logger.error(`writePersistentArray: failed to encode or save data`, filename, caughtError);
            return NaN;
        }
    }

    // key: <original_network_id>.<broadcaster_id>
    // value: <service_id>
    private providerAreaPermission = new Map<string, { lastUpdated: number, serviceIdList: number[] }>();

    public cspSetAccessInfoToProviderArea(data: Uint8Array): boolean {
        const structure = parseBinaryStructure("S:1V,U:2B")!;
        const binfo = this.getBroadcasterInfo();
        if (binfo.originalNetworkId == null || binfo.broadcasterId == null) {
            return false;
        }
        const key = `${binfo.originalNetworkId}.${binfo.broadcasterId}`;
        let off = 0;
        let update: string | undefined;
        let serviceIdList: number[] = [];
        while (off < data.length) {
            // The four sibling readers guard this call; a malformed area must return false rather
            // than throw through browser.ts into the page script.
            let result: any[];
            let readBits: number;
            try {
                [result, readBits] = readBinaryFields(data.subarray(off), structure, getTextDecoder(this.resources.profile));
            } catch (e) {
                this.logger.error(`provider area decode failed`, e);
                return false;
            }
            if (!(readBits > 0)) {
                // A zero-width read would spin here forever.
                this.logger.error(`provider area decode made no progress`, readBits);
                return false;
            }
            if (off === 0) {
                update = result[0] as string;
            }
            serviceIdList.push(result[1] as number);
            off += readBits / 8;
        }
        if (serviceIdList.length < 47) {
            return false;
        }
        if (update?.length !== 12) {
            return false;
        }
        const year = Number.parseInt(update.substring(0, 4));
        const month = Number.parseInt(update.substring(4, 6));
        const day = Number.parseInt(update.substring(6, 8));
        const hour = Number.parseInt(update.substring(8, 10));
        const minute = Number.parseInt(update.substring(10, 12));
        // The provider area's update time is a broadcast wall clock in the stream's local time, not
        // the host's: C16 removed the JST assumption from the page clock and it must not survive here.
        const updateTime = broadcastWallClockToUnixMillis({
            year,
            month,
            day,
            hour,
            minute,
            second: 0,
            offsetMinutes: this.resources.localTimeOffsetMinutes,
        });
        const currentTime = this.resources.currentTimeUnixMillis ?? new Date().getTime();
        if (currentTime < updateTime) {
            return false;
        }
        // 保存しておいた方がいいけど結局毎回SetAccessInfoToProviderArea呼ばれるのでそこまで重要ではない
        this.providerAreaPermission.set(key, { serviceIdList, lastUpdated: updateTime });
        return true;
    }

    public readPersistentArrayWithAccessCheck(filename: string, structure: string): any[] | null {
        if (!filename?.startsWith("nvrams://")) {
            return null;
        }
        const fields = parseBinaryStructure(structure);
        if (!fields) {
            return null;
        }
        const a = this.readNVRAM(filename);
        if (!a) {
            return null;
        }
        try {
            const [result] = readBinaryFields(a, fields, getTextDecoder(this.resources.profile));
            return result;
        } catch (e) {
            // 不正な構造や保存データは BML 側へ例外を漏らさず null で通知する
            this.logger.error(`readPersistentArrayWithAccessCheck: failed to decode data`, filename, e);
            return null;
        }
    }

    public writePersistentArrayWithAccessCheck(filename: string, structure: string, data: any[], period?: Date): number {
        if (!filename?.startsWith("nvrams://")) {
            return NaN;
        }
        const fields = parseBinaryStructure(structure);
        if (!fields) {
            return NaN;
        }
        const dataFieldCount = fields.filter(field => field.type !== BinaryTableType.Pad).length;
        if (dataFieldCount > data.length) {
            this.logger.error(`writePersistentArrayWithAccessCheck: dataFieldCount > data.length`);
            return NaN;
        }
        try {
            const bin = writeBinaryFields(data, fields, getTextEncoder(this.resources.profile));
            return this.writeNVRAM(filename, bin, false);
        } catch (e) {
            // エンコードや保存の失敗は BML 側へ例外を漏らさず NaN で通知する
            this.logger.error(`writePersistentArrayWithAccessCheck: failed to encode or save data`, filename, e);
            return NaN;
        }
    }

    public checkAccessInfoOfPersistentArray(uri: string): number {
        if (uri === "nvram://receiverinfo/zipcode") {
            return 2;
        } else if (uri === "nvram://receiverinfo/regioncode") {
            return 1;
        } else if (uri === "nvram://receiverinfo/prefecture") {
            return 1;
        } else {
            const binfo = this.getBroadcasterInfo();
            const result = this.findNvramArea(uri, binfo);
            if (!result) {
                return NaN;
            }
            const [id, area] = result;
            const k = this.getLocalStorageKey(binfo, id, area, "read");
            if (!k) {
                return 0;
            }
            // 2 = read/write, 1 = read only, 0 = no access, from the area's own permission table.
            return this.areaPermission(area) === "rw" ? 2 : 1;
        }
    }
}
