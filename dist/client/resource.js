"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resources = exports.Profile = void 0;
const entity_parser_1 = require("../server/entity_parser");
const introspection_1 = require("./introspection");
const time_offset_1 = require("./time_offset");
function moduleAndComponentToString(componentId, moduleId) {
    return `${componentId.toString(16).padStart(2, "0")}/${moduleId.toString(16).padStart(4, "0")}`;
}
// ブラウザのキャッシュとは別
class CacheMap {
    cachedRemoteResources = new Map();
    maxEntryCount;
    maxSizeBytes;
    sizeBytes = 0;
    constructor(maxEntryCount, maxSizeBytes) {
        this.maxEntryCount = maxEntryCount;
        this.maxSizeBytes = maxSizeBytes;
    }
    get(url) {
        return this.cachedRemoteResources.get(url);
    }
    set(url, file) {
        this.delete(url);
        if ((file?.data.length ?? 0) > this.maxSizeBytes) {
            return;
        }
        this.cachedRemoteResources.set(url, file);
        this.sizeBytes += file?.data.length ?? 0;
        // 挿入順に列挙される
        // 列挙中に削除しても安全らしい
        if (this.sizeBytes > this.maxSizeBytes || this.cachedRemoteResources.size > this.maxEntryCount) {
            for (const key of this.cachedRemoteResources.keys()) {
                if (this.sizeBytes > this.maxSizeBytes || this.cachedRemoteResources.size > this.maxEntryCount) {
                    this.delete(key);
                }
                else {
                    break;
                }
            }
        }
    }
    delete(url) {
        const entry = this.cachedRemoteResources.get(url);
        if (entry != null) {
            this.sizeBytes -= entry.data.length;
            for (const blob of entry.blobUrl.values()) {
                URL.revokeObjectURL(blob.blobUrl);
            }
            return this.cachedRemoteResources.delete(url);
        }
        else {
            return false;
        }
    }
}
function fromBase64(input) {
    if ("fromBase64" in globalThis.Uint8Array) {
        return Uint8Array.fromBase64(input);
    }
    else {
        return Uint8Array.from(window.atob(input), c => c.charCodeAt(0));
    }
}
var Profile;
(function (Profile) {
    Profile[Profile["BS"] = 7] = "BS";
    Profile[Profile["CS"] = 11] = "CS";
    Profile[Profile["TrProfileA"] = 12] = "TrProfileA";
    Profile[Profile["TrProfileC"] = 13] = "TrProfileC";
})(Profile || (exports.Profile = Profile = {}));
class Resources {
    indicator;
    eventTarget = new EventTarget();
    ip;
    // P1: ページが何を待っているかをホストに見せるための記録。読むだけで、動作には関与しない
    diagnostics = new introspection_1.Diagnostics();
    // P7: how undesignated ARIB text is read. `auto` is the Philippine reading (see arib_text.ts),
    // and a host that needs upstream's strict reading sets "arib". The browser copies it from its
    // options at construction; nothing else writes it.
    textCoding = "auto";
    // The charset the current document declared, so table text can stop guessing UTF-8 on a
    // Japanese page. Content sets it on every document load.
    documentCharset = null;
    // ブラウザのキャッシュとは別に用意 どのみちblob urlの寿命の管理の役目もある
    // とりあえず10 MiB, 400ファイル
    cachedRemoteResources = new CacheMap(400, 1024 * 1024 * 10);
    remoteResourceRequests = new Map();
    logger;
    constructor(indicator, ip, logger) {
        this.indicator = indicator;
        this.ip = ip;
        this.logger = logger;
    }
    _profile;
    get profile() {
        return this._profile;
    }
    _activeDocument = null;
    _currentComponentId = null;
    _currentModuleId = null;
    set activeDocument(doc) {
        const { componentId, moduleId } = this.parseURLEx(doc);
        this._activeDocument = doc;
        this._currentComponentId = componentId;
        this._currentModuleId = moduleId;
        if (!doc?.startsWith("http://") && !doc?.startsWith("https://")) {
            this.baseURIDirectory = null;
        }
    }
    get activeDocument() {
        return this._activeDocument;
    }
    get currentComponentId() {
        return this._currentComponentId;
    }
    get currentModuleId() {
        return this._currentModuleId;
    }
    get currentDataEventId() {
        return this._currentComponentId && (this.cachedComponents.get(this._currentComponentId)?.dataEventId ?? null);
    }
    cachedComponents = new Map();
    downloadComponents = new Map();
    getCachedFileBlobUrl(file, key) {
        let b = file.blobUrl.get(key)?.blobUrl;
        if (b != null) {
            return b;
        }
        b = URL.createObjectURL(new Blob([file.data], { type: `${file.contentType.type}/${file.contentType.originalSubtype}` }));
        file.blobUrl.set(key, { blobUrl: b });
        return b;
    }
    lockedComponents = new Map();
    // component id => PMT
    pmtComponents = new Map();
    pmtRetrieved = false;
    getCachedModule(componentId, moduleId) {
        const cachedComponent = this.cachedComponents.get(componentId);
        if (cachedComponent == null) {
            return undefined;
        }
        return cachedComponent.modules.get(moduleId);
    }
    getPMTComponent(componentId) {
        const pmtComponent = this.pmtComponents.get(componentId);
        return pmtComponent;
    }
    lockCachedModule(componentId, moduleId, lockedBy) {
        const cachedModule = this.getCachedModule(componentId, moduleId);
        if (cachedModule == null) {
            return false;
        }
        const cachedComponent = this.cachedComponents.get(componentId);
        const lockedComponent = this.lockedComponents.get(componentId) ?? {
            componentId,
            modules: new Map(),
            dataEventId: cachedComponent.dataEventId,
        };
        const prevLockedModule = lockedComponent.modules.get(moduleId);
        lockedComponent.modules.set(moduleId, { files: cachedModule.files, lockedBy, moduleId: cachedModule.moduleId, version: cachedModule.version, dataEventId: cachedModule.dataEventId });
        if (prevLockedModule != null) {
            this.revokeCachedModule(componentId, prevLockedModule);
        }
        this.lockedComponents.set(componentId, lockedComponent);
        return true;
    }
    isModuleLocked(componentId, moduleId) {
        return this.lockedComponents.get(componentId)?.modules?.has(moduleId) ?? false;
    }
    getModuleLockedBy(componentId, moduleId) {
        return this.lockedComponents.get(componentId)?.modules?.get(moduleId)?.lockedBy;
    }
    unlockModules(lockedBy) {
        if (lockedBy == null) {
            const components = [...this.lockedComponents.values()];
            this.lockedComponents.clear();
            for (const component of components) {
                this.revokeCachedComponent(component);
            }
        }
        else {
            for (const component of this.lockedComponents.values()) {
                for (const mod of component.modules.values()) {
                    this.unlockModule(component.componentId, mod.moduleId, lockedBy);
                }
            }
        }
        let requestCanceled = false;
        for (const [componentId, component] of this.componentRequests) {
            for (const [moduleId, moduleReq] of component.moduleRequests) {
                component.moduleRequests.set(moduleId, moduleReq.filter((r) => {
                    // lockedByがundefinedならlockModuleOnMemoryとlockModuleOnMemoryExの両方をキャンセル
                    // lockedByがlockModuleOnMemoryならlockModuleOnMemoryをキャンセル
                    // lockedByがlockModuleOnMemoryExならlockModuleOnMemoryExをキャンセル
                    if ((lockedBy == null && r.requestType != null) || (lockedBy != null && r.requestType === lockedBy)) {
                        requestCanceled = true;
                        this.logger.log(`${this.logger.prefix}${r.requestType} request was canceled due to unlockModules ${lockedBy ?? "lockModuleOnMemory+lockModuleOnMemoryEx"}`, moduleAndComponentToString(componentId, moduleId));
                        return false;
                    }
                    return true;
                }));
            }
        }
        if (requestCanceled) {
            this.setReceivingStatus();
        }
    }
    revokeCachedFile(file) {
        for (const blob of file.blobUrl.values()) {
            this.logger.debug(`${this.logger.prefix}revoke`, blob.blobUrl);
            URL.revokeObjectURL(blob.blobUrl);
        }
        file.blobUrl.clear();
    }
    revokeCachedModule(componentId, module) {
        // キャッシュされている(新たなバージョンのモジュールが存在しない)かロックされていれば無効にしない
        if (this.cachedComponents.get(componentId)?.modules?.has(module.moduleId)) {
            return;
        }
        if (this.lockedComponents.get(componentId)?.modules?.has(module.moduleId)) {
            return;
        }
        this.logger.debug(`${this.logger.prefix}revoke`, moduleAndComponentToString(componentId, module.moduleId));
        for (const file of module.files.values()) {
            this.revokeCachedFile(file);
        }
    }
    revokeCachedComponent(component) {
        for (const module of component.modules.values()) {
            this.revokeCachedModule(component.componentId, module);
        }
    }
    unlockModule(componentId, moduleId, lockedBy) {
        const moduleRequests = this.componentRequests.get(componentId)?.moduleRequests;
        const moduleReq = moduleRequests?.get(moduleId);
        let requestCanceled = false;
        if (moduleRequests != null && moduleReq != null) {
            moduleRequests.set(moduleId, moduleReq.filter((r) => {
                if (r.requestType === lockedBy) {
                    requestCanceled = true;
                    this.logger.log(`${this.logger.prefix}${lockedBy} request was canceled due to unlockModule`, moduleAndComponentToString(componentId, moduleId));
                    return false;
                }
                return true;
            }));
            if (requestCanceled) {
                this.setReceivingStatus();
            }
        }
        const m = this.lockedComponents.get(componentId);
        if (m != null) {
            const lockedModule = m.modules.get(moduleId);
            if (lockedModule == null) {
                return requestCanceled;
            }
            if (lockedModule.lockedBy !== lockedBy) {
                return requestCanceled;
            }
            m.modules.delete(moduleId);
            this.revokeCachedModule(componentId, lockedModule);
            return true;
        }
        return requestCanceled;
    }
    componentExistsInDownloadInfo(componentId) {
        return this.downloadComponents.has(componentId);
    }
    getDownloadComponentInfo(componentId) {
        return this.downloadComponents.get(componentId);
    }
    moduleExistsInDownloadInfo(componentId, moduleId) {
        const dcomp = this.downloadComponents.get(componentId);
        if (!dcomp) {
            return false;
        }
        return dcomp.modules.has(moduleId);
    }
    currentProgramInfo = null;
    // STD-B24 第二分冊(1/2) 第二編 9.2.1.2
    get dataCarouselURI() {
        let url = `arib-dc://${this.originalNetworkId?.toString(16)?.padStart(4, "0") ?? -1}.${this.transportStreamId?.toString(16)?.padStart(4, "0") ?? -1}.${this.serviceId?.toString(16)?.padStart(4, "0") ?? -1}`;
        if (this.contentId != null) {
            url += ";" + this.contentId.toString(16)?.padStart(8, "0");
        }
        if (this.eventId != null) {
            url += "." + this.eventId.toString(16)?.padStart(4, "0");
        }
        return url;
    }
    // STD-B24 第二分冊(1/2) 第二編 9.2.5
    get serviceURI() {
        return `arib://${this.originalNetworkId?.toString(16)?.padStart(4, "0") ?? -1}.${this.transportStreamId?.toString(16)?.padStart(4, "0") ?? -1}.${this.serviceId?.toString(16)?.padStart(4, "0") ?? -1}`;
    }
    // STD-B24 第二分冊(1/2) 第二編 9.2.6
    get eventURI() {
        return `arib://${this.originalNetworkId?.toString(16)?.padStart(4, "0") ?? -1}.${this.transportStreamId?.toString(16)?.padStart(4, "0") ?? -1}.${this.serviceId?.toString(16)?.padStart(4, "0") ?? -1}.${this.eventId?.toString(16)?.padStart(4, "0") ?? -1}`;
    }
    get eventName() {
        return this.currentProgramInfo?.eventName ?? null;
    }
    get eventId() {
        return this.currentProgramInfo?.eventId ?? null;
    }
    // not implemented
    get contentId() {
        return null;
    }
    get startTimeUnixMillis() {
        return this.currentProgramInfo?.startTimeUnixMillis ?? null;
    }
    get durationSeconds() {
        return this.currentProgramInfo?.durationSeconds ?? null;
    }
    get serviceId() {
        return this.currentProgramInfo?.serviceId ?? null;
    }
    get originalNetworkId() {
        return this.currentProgramInfo?.originalNetworkId ?? null;
    }
    get networkId() {
        return this.currentProgramInfo?.networkId ?? this.currentProgramInfo?.originalNetworkId ?? null;
    }
    get transportStreamId() {
        return this.currentProgramInfo?.transportStreamId ?? null;
    }
    currentTimeNearestPCRBase;
    _currentTimeUnixMillis;
    _localTimeOffsetMinutes;
    /**
     * C16: a host override for the broadcast local-time offset in minutes from UTC (PH is 480).
     * `null` follows the stream's TOT descriptor, and both fall back to JST.
     */
    timeZoneOffsetMinutes = null;
    /** The audio-output seam: a host that plays ROM sounds/AIFF itself sets this. */
    audioOutput = null;
    maxTOTIntervalMillis = 30 * 1000; // STD-B10的には30秒に1回は送る必要がある ただし実際の運用は5秒間隔で送られる
    /**
     * C16: the stream's local-time offset from UTC in minutes — the host override, else the TOT's
     * local_time_offset descriptor, else JST (the behaviour before this was configurable).
     */
    get localTimeOffsetMinutes() {
        return this.timeZoneOffsetMinutes ?? this._localTimeOffsetMinutes ?? time_offset_1.JST_OFFSET_MINUTES;
    }
    /** Where the offset in use came from: the host, the stream, or the JST default. */
    get localTimeOffsetSource() {
        return this.timeZoneOffsetMinutes != null ? "host" : this._localTimeOffsetMinutes != null ? "stream" : "default";
    }
    /** The stream's own offset from the last TOT, null until one arrives. */
    get streamTimeOffsetMinutes() {
        return this._localTimeOffsetMinutes ?? null;
    }
    get currentTimeUnixMillis() {
        if (this._currentTimeUnixMillis != null && this.nearestPCRBase != null && this.currentTimeNearestPCRBase != null) {
            const pcr = this.nearestPCRBase - this.currentTimeNearestPCRBase;
            if (pcr > 0) {
                return this._currentTimeUnixMillis + Math.min(this.maxTOTIntervalMillis, Math.floor(pcr / 90));
            }
        }
        return this._currentTimeUnixMillis ?? null;
    }
    nearestPCRBase;
    onMessage(msg) {
        if (msg.type === "moduleDownloaded") {
            const cachedComponent = this.cachedComponents.get(msg.componentId) ?? {
                componentId: msg.componentId,
                modules: new Map(),
                dataEventId: msg.dataEventId,
            };
            if (cachedComponent.dataEventId !== msg.dataEventId) {
                return;
            }
            const prevModule = cachedComponent.modules.get(msg.moduleId);
            if (prevModule != null && prevModule.version === msg.version && prevModule.dataEventId === msg.dataEventId) {
                return;
            }
            const cachedModule = {
                moduleId: msg.moduleId,
                files: new Map(msg.files.map(file => ([file.contentLocation?.toLowerCase() ?? null, {
                        contentLocation: file.contentLocation,
                        contentType: file.contentType,
                        data: fromBase64(file.dataBase64),
                        blobUrl: new Map(),
                    }]))),
                version: msg.version,
                dataEventId: msg.dataEventId,
            };
            cachedComponent.modules.set(msg.moduleId, cachedModule);
            if (prevModule != null) {
                this.revokeCachedModule(msg.componentId, prevModule);
            }
            this.cachedComponents.set(msg.componentId, cachedComponent);
            // OnModuleUpdated
            const str = moduleAndComponentToString(msg.componentId, msg.moduleId);
            const creq = this.componentRequests.get(msg.componentId);
            const callbacks = creq?.moduleRequests?.get(msg.moduleId);
            if (creq != null && callbacks != null) {
                creq.moduleRequests.delete(msg.moduleId);
                for (const cb of callbacks) {
                    if (cb.filename == null) {
                        this.logger.debug(`${this.logger.prefix}async fetch done`, str);
                        cb.resolve(cachedModule.files.get(null) ?? null);
                    }
                    else {
                        const file = cachedModule.files.get(cb.filename);
                        this.logger.debug(`${this.logger.prefix}async fetch done`, str, cb.filename);
                        cb.resolve(file ?? null);
                    }
                }
                this.setReceivingStatus();
            }
            this.eventTarget.dispatchEvent(new CustomEvent("moduleupdated", { detail: { componentId: msg.componentId, dataEventId: msg.dataEventId, moduleId: msg.moduleId, version: msg.version } }));
        }
        else if (msg.type === "moduleListUpdated") {
            const component = {
                componentId: msg.componentId,
                modules: new Map(msg.modules.map(x => [x.id, x])),
                dataEventId: msg.dataEventId,
                returnToEntryFlag: msg.returnToEntryFlag,
            };
            const prevComponent = this.getDownloadComponentInfo(msg.componentId);
            this.downloadComponents.set(msg.componentId, component);
            const creqs = this.componentRequests.get(msg.componentId);
            const cachedComponent = this.cachedComponents.get(msg.componentId);
            if (cachedComponent != null) {
                for (const cachedModule of cachedComponent.modules.values()) {
                    const newEntry = component.modules.get(cachedModule.moduleId);
                    if (newEntry == null || newEntry.version !== cachedModule.version) {
                        cachedComponent.modules.delete(cachedModule.moduleId);
                        this.revokeCachedModule(msg.componentId, cachedModule);
                    }
                }
            }
            if (creqs) {
                for (const [moduleId, mreqs] of creqs.moduleRequests) {
                    if (!component.modules.has(moduleId)) {
                        // DIIに存在しない
                        for (const mreq of mreqs) {
                            this.logger.debug(`${this.logger.prefix}async fetch done (failed) DII`, moduleAndComponentToString(msg.componentId, moduleId));
                            mreq.resolve(null);
                        }
                        creqs.moduleRequests.delete(moduleId);
                    }
                }
                this.setReceivingStatus();
            }
            this.eventTarget.dispatchEvent(new CustomEvent("componentupdated", { detail: { component } }));
            // DIIのdata_event_idが更新された
            if (prevComponent != null && prevComponent.dataEventId !== component.dataEventId) {
                if (cachedComponent != null) {
                    this.cachedComponents.delete(msg.componentId);
                    this.revokeCachedComponent(cachedComponent);
                }
                this.eventTarget.dispatchEvent(new CustomEvent("dataeventchanged", { detail: { prevComponent, component, returnToEntryFlag: msg.returnToEntryFlag } }));
            }
        }
        else if (msg.type === "pmt") {
            this.pmtRetrieved = true;
            const prevComponents = this.pmtComponents;
            // 0x0d: データカルーセル
            this.pmtComponents = new Map(msg.components.filter(x => x.streamType === 0x0d).map(x => [x.componentId, x]));
            if (prevComponents.size === 0) {
                this._profile = this.pmtComponents.get(0x40)?.dataComponentId ?? this.pmtComponents.get(0x80)?.dataComponentId;
            }
            for (const [componentId, creqs] of this.componentRequests) {
                if (this.pmtComponents.has(componentId)) {
                    continue;
                }
                for (const [moduleId, mreqs] of creqs.moduleRequests) {
                    // PMTに存在しない
                    for (const mreq of mreqs) {
                        this.logger.debug(`${this.logger.prefix}async fetch done (failed) PMT`, moduleAndComponentToString(componentId, moduleId));
                        mreq.resolve(null);
                    }
                    creqs.moduleRequests.delete(moduleId);
                }
            }
            this.setReceivingStatus();
            this.eventTarget.dispatchEvent(new CustomEvent("pmtupdated", { detail: { components: this.pmtComponents, prevComponents } }));
        }
        else if (msg.type === "programInfo") {
            this.currentProgramInfo = msg;
            const callbacks = this.programInfoCallbacks.slice();
            this.programInfoCallbacks.length = 0;
            for (const cb of callbacks) {
                cb(msg);
            }
            this.setReceivingStatus();
        }
        else if (msg.type === "currentTime") {
            this.currentTimeNearestPCRBase = this.nearestPCRBase;
            this._currentTimeUnixMillis = msg.timeUnixMillis;
            this._localTimeOffsetMinutes = msg.localTimeOffsetMinutes;
        }
        else if (msg.type === "pcr") {
            this.nearestPCRBase = msg.pcrBase;
        }
        else if (msg.type === "error") {
            this.logger.error(`${this.logger.prefix}stream error`, msg);
        }
    }
    // 自ストリームのarib-dc://-1.-1.-1/を除去
    removeDCReferencePrefix(url) {
        const result = /^arib-dc:\/\/(?<originalNetworkId>[0-9a-f]+|-1)\.(?<transportStreamId>[0-9a-f]+|-1)\.(?<serviceId>[0-9a-f]+|-1)($|\/)/i.exec(url);
        if (result?.groups == null) {
            return url;
        }
        const { originalNetworkId, transportStreamId, serviceId } = result.groups;
        if ((Number.parseInt(originalNetworkId, 16) === -1 || Number.parseInt(originalNetworkId, 16) === this.originalNetworkId) &&
            (Number.parseInt(transportStreamId, 16) === -1 || Number.parseInt(transportStreamId, 16) === this.transportStreamId) &&
            (Number.parseInt(serviceId, 16) === -1 || Number.parseInt(serviceId, 16) === this.serviceId)) {
            const suffix = url.substring(result[0].length);
            return "/" + suffix;
        }
        return url;
    }
    parseURL(url) {
        if (url == null) {
            return { component: null, module: null, filename: null };
        }
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return { component: null, module: null, filename: null };
        }
        if (!url.startsWith("arib-dc://") && !url.startsWith("arib://") && (this.activeDocument?.startsWith("http://") || this.activeDocument?.startsWith("https://"))) {
            return { component: null, module: null, filename: null };
        }
        url = this.removeDCReferencePrefix(url);
        // 9.2.11.1 コンポーネントESに対する名前の短縮形
        if (url === "~") {
            const p = this.parseURL(this.activeDocument);
            return { component: p.component, module: null, filename: null };
        }
        // STD-B24 第二分冊 (1/2) 9.2.1.3 名前の短縮形
        if (url.startsWith("~/")) {
            url = ".." + url.substring(1);
        }
        url = new URL(url, "http://localhost" + this.activeDocument).pathname.toLowerCase();
        const components = url.split("/");
        // [0] ""
        // [1] component
        // [2] module
        // [3] filename
        if (components.length > 4) {
            return { component: null, module: null, filename: null };
        }
        return { component: components[1] ?? null, module: components[2] ?? null, filename: components[3] == null ? null : decodeURI(components[3]) };
    }
    parseURLEx(url) {
        const { component, module, filename } = this.parseURL(url);
        const componentId = Number.parseInt(component ?? "", 16);
        const moduleId = Number.parseInt(module ?? "", 16);
        if (!Number.isInteger(componentId)) {
            return { componentId: null, moduleId: null, filename: null };
        }
        if (!Number.isInteger(moduleId)) {
            return { componentId, moduleId: null, filename: null };
        }
        return { componentId, moduleId, filename: filename == null ? null : filename };
    }
    parseAudioReference(url) {
        const { component, module, filename } = this.parseURL(url);
        if (component == null || module != null || filename != null) {
            return { componentId: null, channelId: null };
        }
        const [componentIdPart, channelIdPart, ...remain] = component.split(";");
        if (remain.length !== 0) {
            return { componentId: null, channelId: null };
        }
        const componentId = Number.parseInt(componentIdPart ?? "", 16);
        if (!Number.isInteger(componentId)) {
            return { componentId: null, channelId: null };
        }
        if (channelIdPart == null) {
            return { componentId, channelId: null };
        }
        const channelId = Number.parseInt(channelIdPart ?? "");
        if (!Number.isInteger(channelId) || channelId > 3 || channelId < 1) {
            return { componentId: null, channelId: null };
        }
        return { componentId, channelId };
    }
    mainAudioComponentId;
    mainAudioChannelId;
    get defaultAudioComponentId() {
        // TR-B14 第五分冊 5.1.3 TR-B15 第二分冊, 第四分冊 表14-1
        return 0x10; // 部分受信階層では0x83又は0x85
    }
    fetchLockedResource(url) {
        const { component, module, filename } = this.parseURL(url);
        const componentId = Number.parseInt(component ?? "", 16);
        const moduleId = Number.parseInt(module ?? "", 16);
        if (!Number.isInteger(componentId) || !Number.isInteger(moduleId)) {
            return null;
        }
        let cachedComponent = this.lockedComponents.get(componentId);
        if (cachedComponent == null) {
            cachedComponent = this.cachedComponents.get(componentId);
            if (cachedComponent == null) {
                this.logger.log(`${this.logger.prefix}component not cached `, url);
                return null;
            }
        }
        let cachedModule = cachedComponent.modules.get(moduleId);
        if (cachedModule == null) {
            cachedComponent = this.cachedComponents.get(componentId);
            cachedModule = cachedComponent?.modules?.get(moduleId);
            if (cachedModule == null) {
                this.logger.log(`${this.logger.prefix}module not cached `, url);
                return null;
            }
        }
        const cachedFile = cachedModule.files.get(filename);
        if (cachedFile == null) {
            return null;
        }
        return cachedFile;
    }
    componentRequests = new Map();
    async fetchRemoteResource(url) {
        if (this.ip.get == null || this.activeDocument == null || this.baseURIDirectory == null) {
            return null;
        }
        const full = this.activeDocument.startsWith("http://") || this.activeDocument.startsWith("https://") ? new URL(url, this.activeDocument).toString() : url;
        const cachedFile = this.cachedRemoteResources.get(full);
        if (typeof cachedFile !== "undefined") {
            return cachedFile;
        }
        const requests = this.remoteResourceRequests.get(full);
        if (requests != null) {
            return new Promise((resolve, _) => {
                requests.push({
                    url: full,
                    resolve: (file) => {
                        if (file?.cacheControl !== "no-store") {
                            resolve(file);
                        }
                        else {
                            this.fetchRemoteResource(url).then(x => {
                                resolve(x);
                            });
                        }
                    },
                });
            });
        }
        const requests2 = [];
        this.remoteResourceRequests.set(full, requests2);
        this.indicator?.setNetworkingGetStatus(true);
        const { response, headers } = await this.ip.get(full);
        this.remoteResourceRequests.delete(full);
        if (this.remoteResourceRequests.size === 0) {
            this.indicator?.setNetworkingGetStatus(false);
        }
        if (response == null || headers == null) {
            for (const { resolve } of requests2) {
                resolve(null);
            }
            return null;
        }
        const contentType = headers.get("content-type");
        let mediaType = { originalSubtype: "", originalType: "", parameters: [], subtype: "", type: "" };
        if (contentType != null) {
            const result = (0, entity_parser_1.parseMediaTypeFromString)(contentType);
            if (result.mediaType != null) {
                mediaType = result.mediaType;
            }
        }
        const file = {
            contentLocation: null,
            contentType: mediaType,
            data: response,
            blobUrl: new Map(),
            cacheControl: headers.get("Cache-Control")?.toLowerCase()
        };
        if (file.cacheControl !== "no-store") {
            this.cachedRemoteResources.set(full, file);
        }
        // no-store でも同じ取得を待っている要求には今回受信したデータを返す
        for (const { resolve } of requests2) {
            resolve(file);
        }
        return file;
    }
    invalidateRemoteCache(url) {
        if (this.ip.get == null || this.activeDocument == null || this.baseURIDirectory == null) {
            return;
        }
        const full = this.activeDocument.startsWith("http://") || this.activeDocument.startsWith("https://") ? new URL(url, this.activeDocument).toString() : url;
        this.cachedRemoteResources.delete(full);
    }
    fetchResourceAsync(url, requestType) {
        if (this.isInternetContent) {
            if (((this.activeDocument?.startsWith("http://") || this.activeDocument?.startsWith("https://")) && !url.startsWith("arib://") && !url.startsWith("arib-dc://")) ||
                url.startsWith("http://") || url.startsWith("https://")) {
                return this.fetchRemoteResource(url);
            }
        }
        const res = this.fetchLockedResource(url);
        if (res) {
            return Promise.resolve(res);
        }
        const { componentId, moduleId, filename } = this.parseURLEx(url);
        if (componentId == null || moduleId == null) {
            return Promise.resolve(null);
        }
        if (this.pmtRetrieved) {
            if (this.getCachedModule(componentId, moduleId)) {
                return Promise.resolve(null);
            }
            if (!this.getPMTComponent(componentId)) {
                return Promise.resolve(null);
            }
            const dcomponents = this.downloadComponents.get(componentId);
            if (dcomponents != null && !dcomponents.modules.has(moduleId)) {
                return Promise.resolve(null);
            }
        }
        // PMTにcomponentが存在しかつDIIにmoduleが存在するまたはDIIが取得されていないときにコールバックを登録
        // TODO: ModuleUpdated用にDII取得後に存在しないことが判明したときの処理が必要
        this.logger.debug(`${this.logger.prefix}async fetch requested`, url);
        return new Promise((resolve, _) => {
            const c = this.componentRequests.get(componentId);
            const entry = { filename, resolve, requestType, requestedAt: performance.now() };
            if (c == null) {
                this.componentRequests.set(componentId, { moduleRequests: new Map([[moduleId, [entry]]]) });
            }
            else {
                const m = c.moduleRequests.get(moduleId);
                if (m == null) {
                    c.moduleRequests.set(moduleId, [entry]);
                }
                else {
                    m.push(entry);
                }
            }
            this.setReceivingStatus();
        });
    }
    *getLockedModules() {
        for (const [componentId, c] of this.componentRequests) {
            for (const [moduleId, m] of c.moduleRequests) {
                for (const request of m.slice().reverse()) {
                    if (request.requestType != null) {
                        yield { module: `/${moduleAndComponentToString(componentId, moduleId)}`, isEx: request.requestType === "lockModuleOnMemoryEx", requesting: true };
                        break;
                    }
                }
            }
        }
        for (const c of this.lockedComponents.values()) {
            for (const m of c.modules.values()) {
                yield { module: `/${moduleAndComponentToString(c.componentId, m.moduleId)}`, isEx: m.lockedBy === "lockModuleOnMemoryEx", requesting: false };
            }
        }
    }
    /**
     * P1: the requests that have not been answered, with the reason. This is the difference
     * between "the carousel is slow" and "this module is not in the DII, so it will never
     * arrive" — the two look identical from outside, and only one of them is worth waiting for.
     */
    getPendingResources() {
        const now = performance.now();
        const pending = [];
        for (const [componentId, componentRequests] of this.componentRequests) {
            for (const [moduleId, requests] of componentRequests.moduleRequests) {
                if (requests.length === 0) {
                    continue;
                }
                let since = now;
                let requestType = null;
                for (const request of requests) {
                    since = Math.min(since, request.requestedAt);
                    if (request.requestType != null) {
                        requestType = request.requestType;
                    }
                }
                let reason;
                if (!this.pmtRetrieved) {
                    reason = "pmt-not-received";
                }
                else if (!this.getPMTComponent(componentId)) {
                    reason = "component-not-in-pmt";
                }
                else {
                    const dii = this.downloadComponents.get(componentId);
                    reason = dii != null && !dii.modules.has(moduleId) ? "module-not-in-dii" : "waiting-for-carousel";
                }
                pending.push({
                    module: `/${moduleAndComponentToString(componentId, moduleId)}`,
                    componentId,
                    moduleId,
                    filename: requests[0].filename,
                    requestType,
                    ageMs: now - since,
                    reason,
                });
            }
        }
        return pending;
    }
    /** P1: what the stream has actually delivered, as opposed to what the page asked for. */
    describe() {
        const pmt = [];
        for (const component of this.pmtComponents.values()) {
            pmt.push({
                componentId: component.componentId,
                pid: component.pid,
                streamType: component.streamType,
                dataComponentId: component.dataComponentId ?? null,
            });
        }
        const dii = [];
        for (const component of this.downloadComponents.values()) {
            const modules = [];
            for (const module of component.modules.values()) {
                modules.push({ moduleId: module.id, version: module.version, size: module.size });
            }
            dii.push({
                componentId: component.componentId,
                dataEventId: component.dataEventId,
                returnToEntryFlag: component.returnToEntryFlag ?? null,
                modules,
            });
        }
        const cached = [];
        for (const component of this.cachedComponents.values()) {
            for (const module of component.modules.values()) {
                let bytes = 0;
                for (const file of module.files.values()) {
                    bytes += file.data.length;
                }
                cached.push({
                    componentId: component.componentId,
                    moduleId: module.moduleId,
                    version: module.version,
                    dataEventId: module.dataEventId,
                    files: module.files.size,
                    bytes,
                });
            }
        }
        const locked = [];
        for (const component of this.lockedComponents.values()) {
            for (const module of component.modules.values()) {
                locked.push({
                    componentId: component.componentId,
                    moduleId: module.moduleId,
                    lockedBy: module.lockedBy,
                    version: module.version,
                    files: module.files.size,
                });
            }
        }
        const info = this.currentProgramInfo;
        return {
            profile: this._profile ?? null,
            activeDocument: this._activeDocument,
            startupComponentId: this.startupComponentId,
            pmtRetrieved: this.pmtRetrieved,
            pmt,
            dii,
            cached,
            locked,
            pending: this.getPendingResources(),
            programInfo: info == null ? null : {
                serviceId: info.serviceId,
                eventId: info.eventId,
                eventName: info.eventName,
                originalNetworkId: info.originalNetworkId,
                transportStreamId: info.transportStreamId,
            },
        };
    }
    programInfoCallbacks = [];
    getProgramInfoAsync() {
        if (this.currentProgramInfo != null) {
            return Promise.resolve(this.currentProgramInfo);
        }
        return new Promise((resolve, _) => {
            this.programInfoCallbacks.push(resolve);
            this.setReceivingStatus();
        });
    }
    parseServiceReference(serviceRef) {
        const groups = /^arib:\/\/(?<originalNetworkId>[0-9a-f]+|-1)\.(?<transportStreamId>[0-9a-f]+|-1)\.(?<serviceId>[0-9a-f]+|-1)\/?$/i.exec(serviceRef)?.groups;
        if (groups == null) {
            return { originalNetworkId: null, transportStreamId: null, serviceId: null };
        }
        let originalNetworkId = Number.parseInt(groups.originalNetworkId, 16);
        let transportStreamId = Number.parseInt(groups.transportStreamId, 16);
        let serviceId = Number.parseInt(groups.serviceId, 16);
        if (originalNetworkId == -1) {
            originalNetworkId = this.originalNetworkId;
        }
        if (transportStreamId == -1) {
            transportStreamId = this.transportStreamId;
        }
        if (serviceId == -1) {
            serviceId = this.serviceId;
        }
        return { originalNetworkId, transportStreamId, serviceId };
    }
    setReceivingStatus() {
        if (this.programInfoCallbacks.length != 0 || [...this.componentRequests.values()].some(x => x.moduleRequests.size != 0)) {
            // エントリコンポーネントが存在しない場合か空カルーセルの場合データ放送番組でないのでデータ取得中を表示させない
            if (this.pmtRetrieved && !this.pmtComponents.has(this.startupComponentId)) {
                this.indicator?.setReceivingStatus(false);
            }
            else if (this.downloadComponents.get(this.startupComponentId)?.modules?.size === 0) {
                this.indicator?.setReceivingStatus(false);
            }
            else {
                this.indicator?.setReceivingStatus(true);
            }
        }
        else {
            this.indicator?.setReceivingStatus(false);
        }
    }
    addEventListener(type, callback, options) {
        this.eventTarget.addEventListener(type, callback, options);
    }
    removeEventListener(type, callback, options) {
        this.eventTarget.removeEventListener(type, callback, options);
    }
    clearCache() {
        // this.cachedComponents.clear();
    }
    get startupComponentId() {
        return this._profile === Profile.TrProfileC ? 0x80 : 0x40;
    }
    get startupModuleId() {
        return 0x0000;
    }
    get isInternetContent() {
        return this.baseURIDirectory != null;
    }
    baseURIDirectory = null;
    setBaseURIDirectory(baseURIDirectory) {
        this.baseURIDirectory = uriToBaseURIDirectory(baseURIDirectory);
    }
    checkBaseURIDirectory(url) {
        if (this.baseURIDirectory == null) {
            return false;
        }
        const base = uriToBaseURIDirectory(this.activeDocument?.startsWith("http://") || this.activeDocument?.startsWith("https://") ? new URL(url, this.activeDocument).toString() : url);
        return base.startsWith(this.baseURIDirectory);
    }
}
exports.Resources = Resources;
function uriToBaseURIDirectory(uri) {
    const url = new URL(uri);
    // host: ポート番号含む
    // hostname: 含まない
    const hostname = url.hostname.toLowerCase();
    let pathname = url.pathname;
    const lastSlash = pathname.lastIndexOf("/");
    if (lastSlash !== -1 && lastSlash !== pathname.length - 1) {
        pathname = pathname.substring(0, lastSlash);
    }
    // ASCIIの範囲のURLエンコードをデコード
    pathname = pathname.replace(/%([0-9A-Fa-f]{2})/g, (e, hex) => {
        const d = Number.parseInt(hex, 16);
        if (d !== 0x2F && d >= 0x20 && d < 0x7F) {
            return String.fromCharCode(d);
        }
        else {
            return e;
        }
    });
    return hostname + pathname;
}
//# sourceMappingURL=resource.js.map