"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.areaRelevant = exports.areaCovers = exports.isRegion = exports.isZone = exports.areaName = exports.areaByCode = exports.REGION_MASK = exports.ZONE_MASK = exports.PH_AREAS = exports.decodeARIBText = exports.playRomSound = exports.OverlayInputApplication = exports.AribKeyCode = exports.keyCodeToAribKey = exports.BMLBrowser = exports.bmlBrowserFontNames = void 0;
const arib_text_1 = require("./media/arib_text");
Object.defineProperty(exports, "decodeARIBText", { enumerable: true, get: function () { return arib_text_1.decodeARIBText; } });
const media_type_1 = require("./media/media_type");
const ewbs_1 = require("./ewbs");
const configuration_1 = require("./configuration");
const time_offset_1 = require("./time_offset");
const broadcaster_database_1 = require("./broadcast/broadcaster_database");
const browser_1 = require("./browser");
const content_1 = require("./content");
Object.defineProperty(exports, "keyCodeToAribKey", { enumerable: true, get: function () { return content_1.keyCodeToAribKey; } });
Object.defineProperty(exports, "AribKeyCode", { enumerable: true, get: function () { return content_1.AribKeyCode; } });
const event_queue_1 = require("./event_queue");
const bml_dom_1 = require("./dom/bml_dom");
const es2_interpreter_1 = require("./interpreter/es2_interpreter");
const nvram_1 = require("./nvram/nvram");
const resource_1 = require("./resource");
const logger_1 = require("./util/logger");
const overlay_input_1 = require("./overlay_input");
Object.defineProperty(exports, "OverlayInputApplication", { enumerable: true, get: function () { return overlay_input_1.OverlayInputApplication; } });
const romsound_1 = require("./media/romsound");
Object.defineProperty(exports, "playRomSound", { enumerable: true, get: function () { return romsound_1.playRomSound; } });
// The host contracts live in the leaf module; this file re-exports them so the public API and every
// existing `import { ... } from "web-bml"` keep working.
__exportStar(require("./contracts"), exports);
const format_1 = require("./format");
class DefaultAudioNodeProvider {
    audioContext = new AudioContext();
    getAudioDestinationNode() {
        return this.audioContext.destination;
    }
    destroy() {
        this.audioContext.close();
    }
}
/**
 * The family names the engine's stylesheets ask for. They are **slots**, not descriptions of a face.
 *
 * The three Japanese names are STD-B24 Annex A's own Default Style Sheet family names, which is why a
 * page may say `font-family: 丸ゴシック` and why the engine cannot rename them: they are the standard's
 * vocabulary, not this engine's. What fills a slot is the host's choice (see `fonts:`), so the "look"
 * is a binding, not a name — the M+ stack fills `roundGothic`, `boldRoundGothic` and `squareGothic`
 * with M PLUS 1 Code, which means the three are deliberately the same typeface there, and a page that
 * asks for 角ゴシック gets the same glyphs as one that asks for 丸ゴシック. `BML Fallback` and
 * `BML Last Resort` are the engine's own names because they have no standard equivalent: they exist to
 * sit after the primary family in the cascade.
 */
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
    ewbsDocumentOption;
    ewbsLogger;
    ewbsAlert = null;
    ewbsDecision = null;
    lastLaunchedEwbs = null;
    /** C15: the NVRAM area size the host asked for, null for the table default. */
    nvramAreaBytes = null;
    nvramAffiliationBytes = null;
    nvramBroadcasterBytes = null;
    constructor(options) {
        this.containerElement = options.containerElement;
        this.mediaElement = options.mediaElement;
        this.indicator = options.indicator;
        this.areaCodeOption = options.areaCode;
        this.ewbsDocumentOption = options.ewbsDocument;
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
        const ewbsLogger = setupLogger("ewbs");
        this.ewbsLogger = ewbsLogger;
        this.interpreter = new es2_interpreter_1.ES2Interpreter(interpreterLogger, browserLogger);
        this.eventQueue = new event_queue_1.EventQueue(this.interpreter, eventQueueLogger);
        this.resources = new resource_1.Resources(this.indicator, options.ip ?? {}, resourcesLogger);
        // The interpreter records a page throw itself — it is the only place that knows which script
        // — so what reaches here is the queue's own reason: a malformed handler attribute, or a handler
        // that could not run because the interpreter was already executing. `kind` is that reason and
        // lands in the record's script field, which is why it reads "event handler: …", not a name.
        this.eventQueue.onHandlerFailure = (kind, error) => this.resources.diagnostics.scriptError("run", `event handler: ${kind}`, error);
        this.resources.textCoding = options.textCoding ?? "auto";
        this.resources.timeZoneOffsetMinutes = options.timeZoneOffsetMinutes ?? null;
        this.resources.audioOutput = options.audioOutput ?? null;
        this.nvramAreaBytes = options.nvramAreaBytes ?? null;
        this.nvramAffiliationBytes = options.nvramAffiliationBytes ?? null;
        this.nvramBroadcasterBytes = options.nvramBroadcasterBytes ?? null;
        this.broadcasterDatabase = new broadcaster_database_1.BroadcasterDatabase(this.resources, broadcasterDatabaseLogger, (options.storagePrefix ?? "") + (options.broadcasterDatabasePrefix ?? ""));
        this.broadcasterDatabase.openDatabase();
        this.nvram = new nvram_1.NVRAM(this.resources, this.broadcasterDatabase, nvramLogger, (options.storagePrefix ?? "") + (options.nvramPrefix ?? "nvram_"), {
            areaBytes: options.nvramAreaBytes,
            affiliationBytes: options.nvramAffiliationBytes,
            broadcasterBytes: options.nvramBroadcasterBytes,
        });
        this.bmlDocument = new bml_dom_1.BML.BMLDocument(this.documentElement, this.interpreter, this.eventQueue, this.resources, this.eventTarget, audioNodeProvider, options.inputApplication, options.setMainAudioStreamCallback, domLogger);
        this.eventDispatcher = new event_queue_1.EventDispatcher(this.eventQueue, this.bmlDocument, this.resources, eventLogger);
        this.eventQueue.attachDispatcher(this.eventDispatcher);
        this.content = new content_1.Content(this.bmlDocument, this.documentElement, this.resources, this.eventQueue, this.eventDispatcher, this.interpreter, this.mediaElement, this.eventTarget, this.indicator, {
            videoPlaneModeEnabled: options.videoPlaneModeEnabled ?? false,
            tunnelPointerToVideoPlaneEnabled: options.tunnelPointerToVideoPlaneEnabled ?? false,
            inputApplication: options.inputApplication,
            showErrorMessage: options.showErrorMessage,
            logger: contentLogger,
        });
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
        // C13: the last resort, kept for hosts that register a separate face; the shipped one needs none.
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
        if (msg.type === "emergencyInfo") {
            this.handleEwbsAlert(msg);
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
    /**
     * 2.4.0: the pointer as the remote.
     *
     * `x`/`y` are page CSS pixels (a host maps its pointer into the page, including any scaling). The
     * engine hit-tests, focuses the element under the point and dispatches the same synchronous `click`
     * the Enter key does, so `onfocus` precedes `onclick` as it does on the box. Returns false when
     * nothing focusable is under the point.
     */
    clickAt(x, y) {
        return this.content.clickAt(x, y);
    }
    getDiagnostics() {
        const diagnostics = this.resources.diagnostics;
        const page = this.content.inspect();
        const resources = this.resources.describe();
        const locks = diagnostics.describeLocks();
        const tables = diagnostics.describeTables();
        const errors = diagnostics.describeScripts();
        const audioCodecs = this.resources.audioCodecs;
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
            available.add((0, format_1.formatModuleRef)(module.componentId, module.moduleId));
        }
        for (const module of resources.locked) {
            available.add((0, format_1.formatModuleRef)(module.componentId, module.moduleId));
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
            const normalized = (0, format_1.formatModuleRef)(componentId, moduleId);
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
        const streamErrors = diagnostics.describeStreamErrors();
        if (streamErrors.length > 0) {
            parts.push(`${streamErrors.length} stream error(s): ${streamErrors[streamErrors.length - 1].message}`);
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
                nvramAffiliationBytes: this.nvramAffiliationBytes,
                nvramBroadcasterBytes: this.nvramBroadcasterBytes,
                fonts: this.fonts.map(font => font.family),
            }),
            locks,
            tables,
            errors,
            streamErrors: diagnostics.describeStreamErrors(),
            audioCodecs,
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
     * P2/EWBS: what the receiver does with an alert.
     *
     * The decision is `decideEwbsAction()` (area rules, testable without a DOM); this only does the
     * side effects. A host that configured `ewbsDocument` gets the alert page opened when the alert
     * concerns it; every host can read the current alert from `getEwbsAlert()`.
     */
    handleEwbsAlert(alert) {
        const decision = (0, ewbs_1.decideEwbsAction)(alert, this.getAreaCode(), this.ewbsDocumentOption);
        this.ewbsDecision = decision;
        if (!decision.relevant) {
            // An alert for another area is reported in the decision, but it is not "in force for this
            // receiver": it must not replace the alert that is, nor clear it on its way out.
            return;
        }
        this.ewbsAlert = decision.test ? null : alert;
        if (decision.test) {
            this.lastLaunchedEwbs = null;
            return;
        }
        // The PMT repeats, so the same alert arrives again and again; opening the page each time would
        // restart it several times a second.
        if (decision.launch != null && decision.launch !== this.lastLaunchedEwbs) {
            this.lastLaunchedEwbs = decision.launch;
            this.content.launchDocument(decision.launch).catch((e) => this.ewbsLogger.error(`EWBS alert document failed to open`, decision.launch, e));
        }
    }
    /** The alert currently in force for this receiver, or null. */
    getEwbsAlert() {
        return this.ewbsAlert;
    }
    /** How the last alert was judged: relevant areas, whether it ended, and the document opened. */
    getEwbsDecision() {
        return this.ewbsDecision;
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