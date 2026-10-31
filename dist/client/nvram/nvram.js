"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NVRAM = void 0;
// /documents/nvram.md参照
const binary_table_1 = require("./binary_table");
const profile_1 = require("../profile");
const text_1 = require("../text");
const time_offset_1 = require("../time_offset");
const nvram_sizing_1 = require("./nvram_sizing");
const nvramAreas = [
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
class NVRAM {
    resources;
    broadcasterDatabase;
    logger;
    prefix;
    sizing;
    constructor(resources, broadcasterDatabase, logger, prefix, sizing = {}) {
        this.resources = resources;
        this.broadcasterDatabase = broadcasterDatabase;
        this.logger = logger;
        this.prefix = prefix ?? "nvram_";
        this.sizing = sizing;
    }
    getBroadcasterInfo() {
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
    findNvramArea(url, broadcasterInfo) {
        const match = url.match(/^nvrams?:\/\/((?<affiliationId>[0-9a-fA-F]{2});)?((?<originalNetworkId>[0-9a-fA-F]{4});)?(?<prefix>.+)\/(?<block>\d+)$/);
        if (!match?.groups) {
            return null;
        }
        const isSecure = url.startsWith("nvrams://");
        let affiliationId = parseInt(match?.groups.affiliationId, 16);
        if (!Number.isFinite(affiliationId)) {
            affiliationId = null;
        }
        let originalNetworkId = parseInt(match?.groups.originalNetworkId, 16);
        if (!Number.isFinite(originalNetworkId)) {
            originalNetworkId = null;
        }
        const prefix = match?.groups.prefix;
        const block = parseInt(match?.groups.block) ?? -1;
        for (const area of nvramAreas) {
            // A prefix can carry one row per broadcast type; without this comparison the first
            // (GR) row answered for every receiver, denying BS and CS their own areas.
            if (area.broadcastType === this.broadcastType && prefix === area.prefix && area.isSecure === isSecure) {
                if (area.startBlock <= block && area.lastBlock >= block) {
                    return [
                        { block, affiliationId, originalNetworkId, broadcasterId: broadcasterInfo.broadcasterId, broadcastType: broadcasterInfo.broadcastType },
                        // C15: the PH profile sizes the affiliation and broadcaster areas at 4 KB; the
                        // table's own 64 bytes are the Japanese sizing.
                        { ...area, size: (0, nvram_sizing_1.areaBytesFor)(area.prefix, this.sizing, area.size) },
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
    appendAffiliationId(params, broadcasterInfo, accessInfo) {
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
    appendOriginalNetworkId(params, broadcasterInfo) {
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
    appendOriginalNetworkIdChecked(params, broadcasterInfo, accessInfo) {
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
    get broadcastType() {
        switch (this.resources.profile) {
            case profile_1.Profile.BS:
                return "BS";
            case profile_1.Profile.CS:
                return "CS";
            default:
                return "GR";
        }
    }
    areaPermission(nvramArea) {
        return nvramArea.permissions[this.broadcastType];
    }
    getLocalStorageKey(broadcasterInfo, accessInfo, nvramArea, direction) {
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
            }
            else if (a === "broadcaster_id") {
                if (accessInfo.broadcasterId == null) {
                    this.logger.error(`broadcasterId == null!`);
                    params.append("broadcaster_id", "null");
                }
                else {
                    params.append("broadcaster_id", String(accessInfo.broadcasterId));
                }
            }
            else if (a === "original_network_id") {
                if (!this.appendOriginalNetworkId(params, broadcasterInfo)) {
                    return null;
                }
            }
            else if (a === "affiliation_id;original_network_id") {
                if (accessInfo.affiliationId == null || accessInfo.originalNetworkId == null) {
                    this.logger.error(`invalid`, accessInfo);
                    return null;
                }
                if (accessInfo.originalNetworkId <= 0x0003) {
                    // 系列内共通領域 (0x0000-0x0003; the id is unsigned, so a lower bound is vacuous)
                    params.append("original_network_id", String(accessInfo.originalNetworkId));
                    params.append("affiliation_id", String(accessInfo.affiliationId));
                }
                else if (!this.appendOriginalNetworkIdChecked(params, broadcasterInfo, accessInfo)
                    || !this.appendAffiliationId(params, broadcasterInfo, accessInfo)) {
                    return null;
                }
            }
            else {
                ((_) => { })(a);
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
    readNVRAM(uri) {
        let strg;
        let isFixed;
        let size;
        if (uri === "nvram://receiverinfo/zipcode") {
            strg = localStorage.getItem(this.prefix + "prefix=receiverinfo%2Fzipcode");
            isFixed = true;
            size = 7;
        }
        else if (uri === "nvram://receiverinfo/prefecture") {
            strg = localStorage.getItem(this.prefix + "prefix=receiverinfo%2Fprefecture");
            if (strg == null || strg.length === 0) {
                strg = window.btoa(String.fromCharCode(255));
            }
            isFixed = true;
            size = 1;
        }
        else if (uri === "nvram://receiverinfo/regioncode") {
            strg = localStorage.getItem(this.prefix + "prefix=receiverinfo%2Fregioncode");
            if (strg == null || strg.length === 0) {
                strg = window.btoa(String.fromCharCode(0) + String.fromCharCode(0));
            }
            isFixed = true;
            size = 2;
        }
        else {
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
                }
                else {
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
        let a;
        try {
            a = Uint8Array.from(window.atob(strg), c => c.charCodeAt(0));
        }
        catch (caughtError) {
            this.logger.error(`stored NVRAM value is not valid base64`, caughtError);
            return new Uint8Array(isFixed ? size : 0);
        }
        if (isFixed) {
            if (a.length > size) {
                return a.subarray(0, size);
            }
            else if (a.length < size) {
                const fixed = new Uint8Array(size);
                fixed.set(a);
                return fixed;
            }
        }
        return a;
    }
    writeNVRAM(uri, data, force) {
        // 書き込めない (TR-B14 第二分冊 5.2.7 表5-2参照)
        if (uri === "nvram://receiverinfo/prefecture") {
            if (!force) {
                return NaN;
            }
            localStorage.setItem(this.prefix + "prefix=receiverinfo%2Fprefecture", window.btoa(String.fromCharCode(...data).substring(0, 1)));
            return data.length;
        }
        else if (uri === "nvram://receiverinfo/regioncode") {
            if (!force) {
                return NaN;
            }
            localStorage.setItem(this.prefix + "prefix=receiverinfo%2Fregioncode", window.btoa(String.fromCharCode(...data).substring(0, 2)));
            return data.length;
            // 書き込める (TR-B14 第二分冊 5.2.7 表5-2参照)
        }
        else if (uri === "nvram://receiverinfo/zipcode") {
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
        }
        else {
            localStorage.setItem(this.prefix + k, window.btoa(String.fromCharCode(...data)));
        }
        return data.length;
    }
    readPersistentArray(filename, structure) {
        if (!filename?.startsWith("nvram://")) {
            return null;
        }
        const fields = (0, binary_table_1.parseBinaryStructure)(structure);
        if (!fields) {
            return null;
        }
        const a = this.readNVRAM(filename);
        if (!a) {
            return null;
        }
        try {
            const [result] = (0, binary_table_1.readBinaryFields)(a, fields, (0, text_1.getTextDecoder)(this.resources.profile));
            return result;
        }
        catch (caughtError) {
            // 不正な構造や保存データは BML 側へ例外を漏らさず null で通知する
            this.logger.error(`readPersistentArray: failed to decode data`, filename, caughtError);
            return null;
        }
    }
    writePersistentArray(filename, structure, data, period, force) {
        if (!filename?.startsWith("nvram://")) {
            return NaN;
        }
        const fields = (0, binary_table_1.parseBinaryStructure)(structure);
        if (!fields) {
            return NaN;
        }
        const dataFieldCount = fields.filter(field => field.type !== binary_table_1.BinaryTableType.Pad).length;
        if (dataFieldCount > data.length) {
            this.logger.error(`writePersistentArray: dataFieldCount > data.length`);
            return NaN;
        }
        try {
            const bin = (0, binary_table_1.writeBinaryFields)(data, fields, (0, text_1.getTextEncoder)(this.resources.profile));
            return this.writeNVRAM(filename, bin, force ?? false);
        }
        catch (caughtError) {
            // エンコードや保存の失敗は BML 側へ例外を漏らさず NaN で通知する
            this.logger.error(`writePersistentArray: failed to encode or save data`, filename, caughtError);
            return NaN;
        }
    }
    // key: <original_network_id>.<broadcaster_id>
    // value: <service_id>
    providerAreaPermission = new Map();
    cspSetAccessInfoToProviderArea(data) {
        const structure = (0, binary_table_1.parseBinaryStructure)("S:1V,U:2B");
        const binfo = this.getBroadcasterInfo();
        if (binfo.originalNetworkId == null || binfo.broadcasterId == null) {
            return false;
        }
        const key = `${binfo.originalNetworkId}.${binfo.broadcasterId}`;
        let off = 0;
        let update;
        let serviceIdList = [];
        while (off < data.length) {
            // The four sibling readers guard this call; a malformed area must return false rather
            // than throw through browser.ts into the page script.
            let result;
            let readBits;
            try {
                [result, readBits] = (0, binary_table_1.readBinaryFields)(data.subarray(off), structure, (0, text_1.getTextDecoder)(this.resources.profile));
            }
            catch (e) {
                this.logger.error(`provider area decode failed`, e);
                return false;
            }
            if (!(readBits > 0)) {
                // A zero-width read would spin here forever.
                this.logger.error(`provider area decode made no progress`, readBits);
                return false;
            }
            if (off === 0) {
                update = result[0];
            }
            serviceIdList.push(result[1]);
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
        const updateTime = (0, time_offset_1.broadcastWallClockToUnixMillis)({
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
    readPersistentArrayWithAccessCheck(filename, structure) {
        if (!filename?.startsWith("nvrams://")) {
            return null;
        }
        const fields = (0, binary_table_1.parseBinaryStructure)(structure);
        if (!fields) {
            return null;
        }
        const a = this.readNVRAM(filename);
        if (!a) {
            return null;
        }
        try {
            const [result] = (0, binary_table_1.readBinaryFields)(a, fields, (0, text_1.getTextDecoder)(this.resources.profile));
            return result;
        }
        catch (e) {
            // 不正な構造や保存データは BML 側へ例外を漏らさず null で通知する
            this.logger.error(`readPersistentArrayWithAccessCheck: failed to decode data`, filename, e);
            return null;
        }
    }
    writePersistentArrayWithAccessCheck(filename, structure, data, period) {
        if (!filename?.startsWith("nvrams://")) {
            return NaN;
        }
        const fields = (0, binary_table_1.parseBinaryStructure)(structure);
        if (!fields) {
            return NaN;
        }
        const dataFieldCount = fields.filter(field => field.type !== binary_table_1.BinaryTableType.Pad).length;
        if (dataFieldCount > data.length) {
            this.logger.error(`writePersistentArrayWithAccessCheck: dataFieldCount > data.length`);
            return NaN;
        }
        try {
            const bin = (0, binary_table_1.writeBinaryFields)(data, fields, (0, text_1.getTextEncoder)(this.resources.profile));
            return this.writeNVRAM(filename, bin, false);
        }
        catch (e) {
            // エンコードや保存の失敗は BML 側へ例外を漏らさず NaN で通知する
            this.logger.error(`writePersistentArrayWithAccessCheck: failed to encode or save data`, filename, e);
            return NaN;
        }
    }
    checkAccessInfoOfPersistentArray(uri) {
        if (uri === "nvram://receiverinfo/zipcode") {
            return 2;
        }
        else if (uri === "nvram://receiverinfo/regioncode") {
            return 1;
        }
        else if (uri === "nvram://receiverinfo/prefecture") {
            return 1;
        }
        else {
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
exports.NVRAM = NVRAM;
//# sourceMappingURL=nvram.js.map