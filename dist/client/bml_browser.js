"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areaRelevant = exports.areaCovers = exports.isRegion = exports.isZone = exports.areaName = exports.areaByCode = exports.REGION_MASK = exports.ZONE_MASK = exports.PH_AREAS = exports.decodeARIBText = exports.playRomSound = exports.OverlayInputApplication = exports.AribKeyCode = exports.keyCodeToAribKey = exports.BMLBrowser = exports.bmlBrowserFontNames = exports.inputCharacters = void 0;
const arib_text_1 = require("./arib_text");
Object.defineProperty(exports, "decodeARIBText", { enumerable: true, get: function () { return arib_text_1.decodeARIBText; } });
const media_type_1 = require("./media_type");
const configuration_1 = require("./configuration");
const time_offset_1 = require("./time_offset");
const broadcaster_database_1 = require("./broadcaster_database");
const browser_1 = require("./browser");
const content_1 = require("./content");
Object.defineProperty(exports, "keyCodeToAribKey", { enumerable: true, get: function () { return content_1.keyCodeToAribKey; } });
Object.defineProperty(exports, "AribKeyCode", { enumerable: true, get: function () { return content_1.AribKeyCode; } });
const event_queue_1 = require("./event_queue");
const DOM_1 = require("./interface/DOM");
const es2_interpreter_1 = require("./interpreter/es2_interpreter");
const nvram_1 = require("./nvram");
const resource_1 = require("./resource");
const logger_1 = require("./util/logger");
const overlay_input_1 = require("./overlay_input");
Object.defineProperty(exports, "OverlayInputApplication", { enumerable: true, get: function () { return overlay_input_1.OverlayInputApplication; } });
const romsound_1 = require("./romsound");
Object.defineProperty(exports, "playRomSound", { enumerable: true, get: function () { return romsound_1.playRomSound; } });
class DefaultAudioNodeProvider {
    audioContext = new AudioContext();
    getAudioDestinationNode() {
        return this.audioContext.destination;
    }
    destroy() {
        this.audioContext.close();
    }
}
const hankakuNumber = "0123456789";
const hankakuAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const hankakuSymbol = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const zenkakuHiragana = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわをん";
const zenkakuKatakana = "ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヲン";
const zenkakuNumber = "０１２３４５６７８９";
const zenkakuAlphabet = "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ";
const zenkakuSymbol = "　、。・ー―「」";
exports.inputCharacters = new Map([
    ["number", hankakuNumber],
    ["alphabet", hankakuAlphabet + hankakuSymbol],
    ["hankaku", hankakuAlphabet + hankakuNumber + hankakuSymbol],
    ["zenkaku", zenkakuHiragana + zenkakuKatakana + zenkakuAlphabet + zenkakuNumber + zenkakuSymbol],
    ["katakana", zenkakuKatakana + zenkakuSymbol],
    ["hiragana", zenkakuHiragana + zenkakuSymbol],
]);
exports.bmlBrowserFontNames = Object.freeze({
    roundGothic: "丸ゴシック",
    boldRoundGothic: "太丸ゴシック",
    squareGothic: "角ゴシック",
    phLatin: "PH Latin",
    fallback: "BML Fallback",
    lastResort: "BML Last Resort",
});
class BMLBrowser {
    containerElement;
    shadowRoot;
    documentElement;
    interpreter;
    nvram;
    browserAPI;
    mediaElement;
    resources;
    eventQueue;
    eventDispatcher;
    broadcasterDatabase;
    content;
    bmlDocument;
    indicator;
    eventTarget = new EventTarget();
    fonts = [];
    epg;
    defaultAudioNodeProvider;
    areaCodeOption;
    /** C15: the NVRAM area size the host asked for, null for the table default. */
    nvramAreaBytes = null;
    constructor(options) {
        this.containerElement = options.containerElement;
        this.mediaElement = options.mediaElement;
        this.indicator = options.indicator;
        this.areaCodeOption = options.areaCode;
        this.shadowRoot = options.containerElement.attachShadow({ mode: "closed" });
        this.documentElement = document.createElement("html");
        if (options.tabIndex != null) {
            this.documentElement.tabIndex = options.tabIndex;
        }
        this.shadowRoot.appendChild(this.documentElement);
        let audioNodeProvider = options.audioNodeProvider;
        if (audioNodeProvider == null) {
            this.defaultAudioNodeProvider = new DefaultAudioNodeProvider();
            audioNodeProvider = this.defaultAudioNodeProvider;
        }
        this.epg = options.epg ?? {};
        function setupLogger(channel) {
            return new logger_1.Logger(`${options.log?.prefix ?? "[web-bml]"}[${channel}] `, options.log?.channels?.[channel]?.level ?? options.log?.level);
        }
        const interpreterLogger = setupLogger("interpreter");
        const eventQueueLogger = setupLogger("event-queue");
        const resourcesLogger = setupLogger("resources");
        const broadcasterDatabaseLogger = setupLogger("broadcaster-database");
        const nvramLogger = setupLogger("nvram");
        const domLogger = setupLogger("dom");
        const eventLogger = setupLogger("event-dispatcher");
        const contentLogger = setupLogger("content");
        const browserLogger = setupLogger("browser");
        this.interpreter = new es2_interpreter_1.ES2Interpreter(interpreterLogger, browserLogger);
        this.eventQueue = new event_queue_1.EventQueue(this.interpreter, eventQueueLogger);
        this.resources = new resource_1.Resources(this.indicator, options.ip ?? {}, resourcesLogger);
        this.resources.textCoding = options.textCoding ?? "auto";
        this.resources.timeZoneOffsetMinutes = options.timeZoneOffsetMinutes ?? null;
        this.resources.audioOutput = options.audioOutput ?? null;
        this.nvramAreaBytes = options.nvramAreaBytes ?? null;
        this.broadcasterDatabase = new broadcaster_database_1.BroadcasterDatabase(this.resources, broadcasterDatabaseLogger, (options.storagePrefix ?? "") + (options.broadcasterDatabasePrefix ?? ""));
        this.broadcasterDatabase.openDatabase();
        this.nvram = new nvram_1.NVRAM(this.resources, this.broadcasterDatabase, nvramLogger, (options.storagePrefix ?? "") + (options.nvramPrefix ?? "nvram_"), {
            areaBytes: options.nvramAreaBytes,
            affiliationBytes: options.nvramAffiliationBytes,
            broadcasterBytes: options.nvramBroadcasterBytes,
        });
        this.bmlDocument = new DOM_1.BML.BMLDocument(this.documentElement, this.interpreter, this.eventQueue, this.resources, this.eventTarget, audioNodeProvider, options.inputApplication, options.setMainAudioStreamCallback, domLogger);
        this.eventDispatcher = new event_queue_1.EventDispatcher(this.eventQueue, this.bmlDocument, this.resources, eventLogger);
        this.eventQueue.dispatchBlur = this.eventDispatcher.dispatchBlur.bind(this.eventDispatcher);
        this.eventQueue.dispatchClick = this.eventDispatcher.dispatchClick.bind(this.eventDispatcher);
        this.eventQueue.dispatchFocus = this.eventDispatcher.dispatchFocus.bind(this.eventDispatcher);
        this.eventQueue.dispatchChange = this.eventDispatcher.dispatchChange.bind(this.eventDispatcher);
        this.content = new content_1.Content(this.bmlDocument, this.documentElement, this.resources, this.eventQueue, this.eventDispatcher, this.interpreter, this.mediaElement, this.eventTarget, this.indicator, options.videoPlaneModeEnabled ?? false, options.tunnelPointerToVideoPlaneEnabled ?? false, options.inputApplication, options.showErrorMessage, contentLogger);
        this.browserAPI = new browser_1.BrowserAPI(this.resources, this.eventQueue, this.eventDispatcher, this.content, this.nvram, this.interpreter, audioNodeProvider, options.ip ?? {}, this.indicator, options.ureg, options.greg, options.X_DPA_startResidentApp, browserLogger);
        this.interpreter.setupEnvironment(this.browserAPI, this.resources, this.content, this.epg);
        if (options.fonts?.roundGothic) {
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.roundGothic, options.fonts?.roundGothic.source, options.fonts?.roundGothic.descriptors));
        }
        if (options.fonts?.boldRoundGothic) {
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.roundGothic, options.fonts?.boldRoundGothic.source, { ...options.fonts?.boldRoundGothic.descriptors, weight: "bold" }));
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.boldRoundGothic, options.fonts?.boldRoundGothic.source, options.fonts?.boldRoundGothic.descriptors));
        }
        else if (options.fonts?.roundGothic) {
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.boldRoundGothic, options.fonts?.roundGothic.source, options.fonts?.roundGothic.descriptors));
        }
        if (options.fonts?.squareGothic) {
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.squareGothic, options.fonts?.squareGothic.source, options.fonts?.squareGothic.descriptors));
        }
        // P13/C13: the PH Latin fallback, registered only when the host supplies it. The default CSS
        // names the family after the BML one, so a page's `ñ` takes this face instead of `monospace`.
        if (options.fonts?.phLatin) {
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.phLatin, options.fonts.phLatin.source, options.fonts.phLatin.descriptors));
        }
        // C13: the all-M+ fallback (M PLUS 1p), for the ranges M PLUS 1 Code cannot draw.
        if (options.fonts?.fallback) {
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.fallback, options.fonts.fallback.source, options.fonts.fallback.descriptors));
        }
        // C13: the M+ stack's last resort (Kosugi), for a character neither of the other two has.
        if (options.fonts?.lastResort) {
            this.fonts.push(new FontFace(exports.bmlBrowserFontNames.lastResort, options.fonts.lastResort.source, options.fonts.lastResort.descriptors));
        }
        for (const font of this.fonts) {
            document.fonts.add(font);
        }
    }
    emitMessage(msg) {
        if (msg.type === "programInfo") {
            this.indicator?.setEventName(msg.eventName);
        }
        this.resources.onMessage(msg);
        this.broadcasterDatabase.onMessage(msg);
        this.browserAPI.onMessage(msg);
        this.content.onMessage(msg);
    }
    /**
     * P1 — the introspection seam, host side.
     *
     * Answers the question a receiver engineer actually asks when a page does not draw: *what is
     * it waiting for?* Everything here is a snapshot of state the engine already keeps; the call
     * mutates nothing, so a host may call it as often as it likes (ours polls it once per second
     * and on every page event) and a receiver may expose it on a diagnostics port.
     *
     * Plain JSON: numbers that would be NaN are null, so the result survives `JSON.stringify`
     * unchanged and can go over a pipe to another process.
     */
    getDiagnostics() {
        const diagnostics = this.resources.diagnostics;
        const page = this.content.inspect();
        const resources = this.resources.describe();
        const locks = diagnostics.describeLocks();
        const tables = diagnostics.describeTables();
        const errors = diagnostics.describeScripts();
        const pendingByReason = {};
        for (const pending of resources.pending) {
            pendingByReason[pending.reason] = (pendingByReason[pending.reason] ?? 0) + 1;
        }
        const locksAwaitingEvent = locks.filter(lock => (lock.api === "lockModuleOnMemory" || lock.api === "lockModuleOnMemoryEx") && lock.moduleLockedEvent == null && lock.outcome !== "failed-after-request").length;
        // A subscription that has never fired is *normal* when the host locked the module before
        // the page subscribed — the bevent was dispatched and nothing was listening yet. What is
        // not normal is a ModuleLocked subscription naming a module the engine neither has nor is
        // waiting for: that one can never fire, and the page will wait on it for ever.
        const available = new Set();
        for (const module of resources.cached) {
            available.add(`/${module.componentId.toString(16).padStart(2, "0")}/${module.moduleId.toString(16).padStart(4, "0")}`);
        }
        for (const module of resources.locked) {
            available.add(`/${module.componentId.toString(16).padStart(2, "0")}/${module.moduleId.toString(16).padStart(4, "0")}`);
        }
        const pendingModules = new Set(resources.pending.map(pending => pending.module));
        const missingModules = [];
        for (const beitem of page.beitems) {
            if (!beitem.subscribe || beitem.fired > 0 || beitem.type !== "ModuleLocked" || beitem.ref == null) {
                continue;
            }
            const { componentId, moduleId } = this.resources.parseURLEx(beitem.ref);
            if (componentId == null || moduleId == null) {
                continue;
            }
            const normalized = `/${componentId.toString(16).padStart(2, "0")}/${moduleId.toString(16).padStart(4, "0")}`;
            if (!available.has(normalized) && !pendingModules.has(normalized)) {
                missingModules.push(normalized);
            }
        }
        const noEvent = page.beitems.filter(beitem => beitem.subscribe && beitem.hasHandler && beitem.fired === 0).length;
        const parts = [`${page.phase}${page.document == null ? "" : " " + page.document}`];
        if (page.detail != null) {
            parts.push(page.detail);
        }
        if (resources.pending.length === 0) {
            parts.push("nothing pending");
        }
        else {
            const reasons = Object.entries(pendingByReason).map(([reason, n]) => `${n} ${reason}`).join(", ");
            parts.push(`${resources.pending.length} pending (${reasons})`);
        }
        if (locksAwaitingEvent > 0) {
            parts.push(`${locksAwaitingEvent} lock(s) without a ModuleLocked event`);
        }
        if (missingModules.length > 0) {
            parts.push(`${missingModules.length} subscription(s) waiting on a module that is not here`);
        }
        const failedTables = tables.filter(table => table.outcome !== "found").length;
        if (failedTables > 0) {
            parts.push(`${failedTables} table read(s) failed`);
        }
        if (errors.length > 0) {
            parts.push(`${errors.length} script error(s)`);
        }
        return {
            version: 1,
            at: performance.now(),
            summary: parts.join(" · "),
            areaCode: this.getAreaCode(),
            page,
            resources,
            configuration: (0, configuration_1.describeConfiguration)({
                textCoding: this.resources.textCoding,
                hostOffsetMinutes: this.resources.timeZoneOffsetMinutes,
                streamOffsetMinutes: this.resources.streamTimeOffsetMinutes,
                defaultOffsetMinutes: time_offset_1.JST_OFFSET_MINUTES,
                nvramAreaBytes: this.nvramAreaBytes,
                fonts: this.fonts.map(font => font.family),
            }),
            locks,
            tables,
            errors,
            events: diagnostics.describeEvents(),
            health: {
                pendingByReason,
                locksAwaitingEvent,
                failedTables,
                /** subscribed, has a handler, and its bevent has never run — informational */
                subscriptionsWithNoEvent: noEvent,
                /** a ModuleLocked subscription for a module that is neither cached, locked nor pending */
                missingModules,
            },
        };
    }
    /**
     * P2: the receiver's EWBS area code, or null when the host has none. Read through the getter the
     * host supplied, so a receiver whose area setting changes while a page is up is reflected without
     * the page being reloaded. A value outside the 12-bit field is refused rather than masked: a host
     * bug should look like "no area", not like a wrong one.
     */
    getAreaCode() {
        const source = this.areaCodeOption;
        const value = typeof source === "function" ? source() : source;
        if (value == null || !Number.isFinite(value)) {
            return null;
        }
        const code = Number(value);
        return Number.isInteger(code) && code >= 0 && code <= 0xfff ? code : null;
    }
    addEventListener(type, callback, options) {
        this.eventTarget.addEventListener(type, callback, options);
    }
    removeEventListener(type, callback, options) {
        this.eventTarget.removeEventListener(type, callback, options);
    }
    getVideoElement() {
        return (0, media_type_1.findVideoElement)(this.documentElement);
    }
    async destroy() {
        for (const font of this.fonts) {
            document.fonts.delete(font);
        }
        this.fonts.length = 0;
        await this.content.exitDocument();
        if (this.defaultAudioNodeProvider != null) {
            this.defaultAudioNodeProvider.destroy();
        }
    }
    setMainAudioStream(componentId, channelId) {
        const { mainAudioComponentId: prevComponentId, mainAudioChannelId: prevChannelId } = this.resources;
        if (componentId === prevComponentId && channelId === prevChannelId) {
            return;
        }
        this.resources.mainAudioComponentId = componentId;
        this.resources.mainAudioChannelId = channelId;
        if (prevComponentId == null) {
            return;
        }
        this.eventDispatcher.dispatchMainAudioStreamChangedEvent(prevComponentId, prevChannelId, componentId, channelId);
    }
}
exports.BMLBrowser = BMLBrowser;
var area_code_1 = require("./area_code");
Object.defineProperty(exports, "PH_AREAS", { enumerable: true, get: function () { return area_code_1.PH_AREAS; } });
Object.defineProperty(exports, "ZONE_MASK", { enumerable: true, get: function () { return area_code_1.ZONE_MASK; } });
Object.defineProperty(exports, "REGION_MASK", { enumerable: true, get: function () { return area_code_1.REGION_MASK; } });
Object.defineProperty(exports, "areaByCode", { enumerable: true, get: function () { return area_code_1.areaByCode; } });
Object.defineProperty(exports, "areaName", { enumerable: true, get: function () { return area_code_1.areaName; } });
Object.defineProperty(exports, "isZone", { enumerable: true, get: function () { return area_code_1.isZone; } });
Object.defineProperty(exports, "isRegion", { enumerable: true, get: function () { return area_code_1.isRegion; } });
Object.defineProperty(exports, "areaCovers", { enumerable: true, get: function () { return area_code_1.areaCovers; } });
Object.defineProperty(exports, "areaRelevant", { enumerable: true, get: function () { return area_code_1.areaRelevant; } });
//# sourceMappingURL=bml_browser.js.map