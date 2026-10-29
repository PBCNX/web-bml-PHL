import type { ResponseMessage } from "../protocol/messages";
import type { EmergencyInfoMessage } from "../protocol/messages";
import { decodeARIBText, type TextCoding } from "./media/arib_text";
import type { AudioOutput } from "./media/audio_output";
import { type EwbsDocument, type EwbsDecision } from "./ewbs";
import { type ConfigurationSnapshot } from "./configuration";
import { BroadcasterDatabase } from "./broadcast/broadcaster_database";
import { BrowserAPI } from "./browser";
import { Content, keyCodeToAribKey, AribKeyCode, type PageInspection } from "./content";
import { type BeventRecord, type LockRecord, type ScriptRecord, type StreamErrorRecord, type TableRecord } from "./introspection";
import { NVRAM } from "./nvram/nvram";
import { type ResourcesDescription } from "./resource";
import { type LogLevel as LoggerLogLevel } from "./util/logger";
import { OverlayInputApplication } from "./overlay_input";
import { playRomSound } from "./media/romsound";
/**
 * P1: the snapshot `BMLBrowser#getDiagnostics()` returns. Plain JSON — NaN is null, no class
 * instances, no DOM nodes — so a host can stringify it, log it, or send it over a pipe.
 */
export type DiagnosticsSnapshot = {
    version: 1;
    /** performance.now() at the snapshot */
    at: number;
    /** one line, meant for a status bar: phase, what is pending and why, and what failed */
    summary: string;
    /**
     * P2: the receiver's EWBS area code as the host reported it, or null when it reported none.
     * Not the stream's — an area code belongs to the receiver, so this is what the host supplied.
     */
    areaCode: number | null;
    page: PageInspection;
    resources: ResourcesDescription;
    /** The per-host settings that change what a page shows: P7 textCoding, C16 offset, C15 NVRAM, C13 fonts. */
    configuration: ConfigurationSnapshot;
    locks: LockRecord[];
    tables: TableRecord[];
    errors: ScriptRecord[];
    /** messages the stream's own error channel sent, which the page itself cannot see */
    streamErrors: StreamErrorRecord[];
    events: BeventRecord[];
    health: {
        pendingByReason: Record<string, number>;
        locksAwaitingEvent: number;
        failedTables: number;
        /** subscribed with a handler, bevent never ran — normal when the host locked first */
        subscriptionsWithNoEvent: number;
        /** a ModuleLocked subscription for a module that is not cached, locked or pending */
        missingModules: string[];
    };
};
export * from "./contracts";
import { AudioNodeProvider, BMLBrowserEventMap, EPG, IP, Indicator, InputApplication, Reg } from "./contracts";
export type BMLBrowserFontFace = {
    source: string | BufferSource;
    descriptors?: FontFaceDescriptors | undefined;
};
export type BMLBrowserFonts = {
    roundGothic?: BMLBrowserFontFace;
    boldRoundGothic?: BMLBrowserFontFace;
    squareGothic?: BMLBrowserFontFace;
    /**
     * P13/C13: the Philippine Latin fallback. The BML faces are Japanese and carry no Latin-1
     * accented letters, so a label with `ñ` falls back per character — to a proportional system face,
     * which breaks the half-width cell. This optional face is tried after the BML family and before
     * `monospace`; if its advances are half an em (the shipped `PHLatin-Regular.woff2` is), the cell
     * grid survives. Not registering it is harmless: the page behaves exactly as before.
     */
    phLatin?: BMLBrowserFontFace;
    /**
     * C13, the all-M+ stack: the face tried after `phLatin` and before `monospace`, for the ranges
     * the primary face cannot draw. With `MPLUS1Code-Regular.woff2` as `roundGothic` the primary
     * covers Latin/accents at 0.5 em and kana/kanji at 1 em, but has no full-width forms, half-width
     * kana or symbols; `MPLUS1P-Regular.woff2` here supplies those at 1 em / 0.5 em / ~1 em. The
     * chain is `"丸ゴシック", "PH Latin", "BML Fallback", "BML Last Resort", monospace` — every step is
     * at the BML cell, so layout does not move. Not registering it is harmless (as before).
     */
    fallback?: BMLBrowserFontFace;
    /**
     * C13, the M+ stack's last resort: the face tried after `fallback` and before `monospace`, for a
     * character neither the primary nor `MPLUS1P` has. With the all-M+ configuration that is Kosugi
     * (`霾`, U+972D, is the one corpus character only it has).
     */
    lastResort?: BMLBrowserFontFace;
};
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
export declare const bmlBrowserFontNames: Readonly<{
    roundGothic: "丸ゴシック";
    boldRoundGothic: "太丸ゴシック";
    squareGothic: "角ゴシック";
    phLatin: "PH Latin";
    fallback: "BML Fallback";
    lastResort: "BML Last Resort";
}>;
export type LogLevel = LoggerLogLevel;
export type LogChannelOptions = {
    /**
     * ログレベル
     */
    level?: LogLevel;
};
export type LogOptions = {
    /**
     * ログ出力のプレフィックス
     */
    prefix?: string;
    /**
     * ログレベル
     */
    level?: LogLevel;
    /**
     * チャンネルごとの設定
     */
    channels?: {
        [channel: string]: LogChannelOptions;
    };
};
export type BMLBrowserOptions = {
    containerElement: HTMLElement;
    mediaElement: HTMLElement;
    indicator?: Indicator;
    fonts?: BMLBrowserFonts;
    storagePrefix?: string;
    nvramPrefix?: string;
    broadcasterDatabasePrefix?: string;
    tabIndex?: number;
    epg?: EPG;
    /**
     * 動画像プレーンモードを有効化
     * 動画像が配置されている部分が切り抜かれるためvideochangedイベントに合わせて動画を配置する
     */
    videoPlaneModeEnabled?: boolean;
    tunnelPointerToVideoPlaneEnabled?: boolean;
    audioNodeProvider?: AudioNodeProvider;
    ip?: IP;
    inputApplication?: InputApplication;
    ureg?: Reg;
    greg?: Reg;
    setMainAudioStreamCallback?: (componentId: number, channelId?: number) => boolean;
    X_DPA_startResidentApp?: (appName: string, showAV: number, returnURI: string, Ex_info: string[]) => number;
    /**
     * エラーメッセージを表示
     * 未指定の時は<dialog>とshowModalが使われる
     */
    showErrorMessage?: (title: string, message: string, code?: string) => void;
    /**
     * P7: how ARIB text fields that carry no character-set designation are read.
     * `auto` (default) is the Philippine reading — valid UTF-8 is UTF-8, and 7-bit text that looks
     * like text reads as ASCII. `arib` keeps upstream's strict reading (the profile's decoder) and
     * only adds designation handling. See arib_text.ts for the rule and its measured evidence.
     */
    textCoding?: TextCoding;
    /**
     * P2: the receiver's EWBS area code (12 bits, e.g. `0x426` Manila). A number, or a getter for a
     * host whose receiver setting can change while a page is up — on BaronTV that is
     * `TVApiIsdbEwbsService.eventGetIsdbEwbsAreaCode`. Omitted or null means the host has no area
     * (a receiver with nothing configured), which `areaRelevant()` treats as "show everything".
     */
    areaCode?: number | null | (() => number | null);
    /**
     * P2/EWBS: the document to open when an emergency alert concerns this receiver (for example
     * `"/50/2000"` for a receiver whose alert page is in the carousel). Omitted means no document is
     * opened — the alert is still exposed through `getEwbsAlert()`. A function may pick per alert.
     */
    ewbsDocument?: EwbsDocument;
    /**
     * C16: the broadcast local-time offset from UTC in minutes (PH `480`, Japan `540`). Omitted means
     * follow the stream's TOT local_time_offset descriptor, and fall back to JST where it is absent —
     * the behaviour before this option existed. A host whose streams carry the descriptor should leave
     * this out; a host that knows its zone but whose TOT does not should set it.
     */
    timeZoneOffsetMinutes?: number;
    /**
     * The audio-output seam: a host that plays the engine's sound itself (Android's native audio)
     * passes its hooks here instead of patching arib_aiff.ts/romsound.ts. Each hook returns true when
     * the host played it; the engine then does nothing. Omitted means the built-in WebAudio path.
     */
    audioOutput?: AudioOutput;
    /**
     * C15: bytes for the NVRAM affiliation ("group") and broadcaster ("local") areas. The base table
     * follows the Japanese 64-byte areas; the Philippine standard sizes both at 4 KB, so a PH host
     * passes `4096`. `nvramAffiliationBytes` / `nvramBroadcasterBytes` override one area each.
     */
    nvramAreaBytes?: number;
    nvramAffiliationBytes?: number;
    nvramBroadcasterBytes?: number;
    log?: LogOptions;
};
export declare class BMLBrowser {
    private containerElement;
    private shadowRoot;
    private documentElement;
    private interpreter;
    readonly nvram: NVRAM;
    readonly browserAPI: BrowserAPI;
    private mediaElement;
    private resources;
    private eventQueue;
    private eventDispatcher;
    readonly broadcasterDatabase: BroadcasterDatabase;
    readonly content: Content;
    private readonly bmlDocument;
    private indicator?;
    private eventTarget;
    private fonts;
    private readonly epg;
    private readonly defaultAudioNodeProvider?;
    private readonly areaCodeOption?;
    private readonly ewbsDocumentOption?;
    private readonly ewbsLogger;
    private ewbsAlert;
    private ewbsDecision;
    private lastLaunchedEwbs;
    /** C15: the NVRAM area size the host asked for, null for the table default. */
    private readonly nvramAreaBytes;
    private readonly nvramAffiliationBytes;
    private readonly nvramBroadcasterBytes;
    constructor(options: BMLBrowserOptions);
    emitMessage(msg: ResponseMessage): void;
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
    getDiagnostics(): DiagnosticsSnapshot;
    /**
     * P2/EWBS: what the receiver does with an alert.
     *
     * The decision is `decideEwbsAction()` (area rules, testable without a DOM); this only does the
     * side effects. A host that configured `ewbsDocument` gets the alert page opened when the alert
     * concerns it; every host can read the current alert from `getEwbsAlert()`.
     */
    private handleEwbsAlert;
    /** The alert currently in force for this receiver, or null. */
    getEwbsAlert(): EmergencyInfoMessage | null;
    /** How the last alert was judged: relevant areas, whether it ended, and the document opened. */
    getEwbsDecision(): EwbsDecision | null;
    /**
     * P2: the receiver's EWBS area code, or null when the host has none. Read through the getter the
     * host supplied, so a receiver whose area setting changes while a page is up is reflected without
     * the page being reloaded. A value outside the 12-bit field is refused rather than masked: a host
     * bug should look like "no area", not like a wrong one.
     */
    getAreaCode(): number | null;
    addEventListener<K extends keyof BMLBrowserEventMap>(type: K, callback: (this: undefined, evt: BMLBrowserEventMap[K]) => void, options?: AddEventListenerOptions | boolean): void;
    removeEventListener<K extends keyof BMLBrowserEventMap>(type: K, callback: (this: undefined, evt: BMLBrowserEventMap[K]) => void, options?: AddEventListenerOptions | boolean): void;
    getVideoElement(): HTMLElement | null;
    destroy(): Promise<void>;
    setMainAudioStream(componentId: number, channelId?: number): void;
}
export { keyCodeToAribKey, AribKeyCode };
export { OverlayInputApplication };
export { playRomSound };
export { decodeARIBText };
export type { TextCoding } from "./media/arib_text";
export type { AudioOutput } from "./media/audio_output";
export type { ResponseMessage } from "../protocol/messages";
export { PH_AREAS, ZONE_MASK, REGION_MASK, areaByCode, areaName, isZone, isRegion, areaCovers, areaRelevant } from "./area_code";
export type { AreaCode } from "./area_code";
export type { PageInspection, Content } from "./content";
export type { ResourcesDescription } from "./resource";
export type { ConfigurationSnapshot } from "./configuration";
export type { BeventRecord, LockRecord, ScriptRecord, StreamErrorRecord, TableRecord } from "./introspection";
export type { NVRAM } from "./nvram/nvram";
export type { BrowserAPI } from "./browser";
export type { EwbsDecision, EwbsDocument } from "./ewbs";
export type { BeitemInspection } from "./content";
export type { PendingResource } from "./resource";
export type { LocalTimeOffsetSource } from "./time_offset";
export type { BroadcasterDatabase } from "./broadcast/broadcaster_database";
//# sourceMappingURL=bml_browser.d.ts.map