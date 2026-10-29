import { ResponseMessage } from "../server/ws_api";
import { decodeARIBText, type TextCoding } from "./arib_text";
import type { AudioOutput } from "./audio_output";
import { type ConfigurationSnapshot } from "./configuration";
import { BroadcasterDatabase } from "./broadcaster_database";
import { BrowserAPI } from "./browser";
import { Content, keyCodeToAribKey, AribKeyCode, type PageInspection } from "./content";
import { type BeventRecord, type LockRecord, type ScriptRecord, type TableRecord } from "./introspection";
import { NVRAM } from "./nvram";
import { type ResourcesDescription } from "./resource";
import { type LogLevel as LoggerLogLevel } from "./util/logger";
import { OverlayInputApplication } from "./overlay_input";
import { playRomSound } from "./romsound";
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
export interface AudioNodeProvider {
    getAudioDestinationNode(): AudioNode;
}
export interface Indicator {
    setUrl(name: string, loading: boolean): void;
    setReceivingStatus(receiving: boolean): void;
    setNetworkingGetStatus(get: boolean): void;
    setNetworkingPostStatus(post: boolean): void;
    setEventName(eventName: string | null): void;
}
export interface EPG {
    tune?(originalNetworkId: number, transportStreamId: number, serviceId: number): boolean | never;
    tuneToComponent?(originalNetworkId: number, transportStreamId: number, serviceId: number, component: string): boolean | never;
}
export interface IP {
    isIPConnected?(): number;
    getConnectionType?(): number;
    transmitTextDataOverIP?(uri: string, body: Uint8Array<ArrayBuffer>): Promise<{
        resultCode: number;
        statusCode: string;
        response: Uint8Array;
    }>;
    get?(uri: string): Promise<{
        response?: Uint8Array<ArrayBuffer>;
        headers?: Headers;
        statusCode?: number;
    }>;
    confirmIPNetwork?(destination: string, isICMP: boolean, timeoutMillis: number): Promise<{
        success: boolean;
        ipAddress: string | null;
        responseTimeMillis: number | null;
    } | null>;
}
export type InputCharacterType = "all" | "number" | "alphabet" | "hankaku" | "zenkaku" | "katakana" | "hiragana";
export declare const inputCharacters: Map<InputCharacterType, string>;
export type InputCancelReason = "other" | "unload" | "readonly" | "blur" | "invisible";
export type InputApplicationLaunchOptions = {
    characterType: InputCharacterType;
    allowedCharacters?: string;
    maxLength: number;
    value: string;
    inputMode: "text" | "password";
    multiline: boolean;
    callback: (value: string) => void;
};
/**
 * TR-B14 第二分冊 1.6 文字入力機能
 */
export interface InputApplication {
    /**
     * 文字入力アプリケーションを起動
     */
    launch(options: InputApplicationLaunchOptions): void;
    /**
     * 文字入力アプリケーションを終了
     * 起動中に文書の遷移、フォーカス移動、readonly属性の設定、invisible属性が有効になった場合など
     */
    cancel(reason: InputCancelReason): void;
}
export interface Reg {
    getReg(index: number): string | undefined;
    setReg(index: number, value: string): void;
}
export type KeyGroup = "basic" | "data-button" | "numeric-tuning" | "other-tuning" | "special-1" | "special-2";
export type Profile = "C" | "A" | "BS" | "CS" | "";
interface BMLBrowserEventMap {
    "load": CustomEvent<{
        resolution: {
            width: number;
            height: number;
        };
        displayAspectRatio: {
            numerator: number;
            denominator: number;
        };
        profile: Profile;
    }>;
    "invisible": CustomEvent<boolean>;
    /**
     * 動画の位置や大きさが変わった際に呼ばれるイベント
     * invisibleがtrueである場合渡される矩形に関わらず全面に表示する必要がある
     */
    "videochanged": CustomEvent<{
        clientRect: {
            left: number;
            top: number;
            right: number;
            bottom: number;
        };
        boundingRect: DOMRect;
    }>;
    "usedkeylistchanged": CustomEvent<{
        usedKeyList: Set<KeyGroup>;
    }>;
    "audiostreamchanged": CustomEvent<{
        componentId: number;
        channelId?: number;
    }>;
}
interface CustomEventTarget<M> {
    addEventListener<K extends keyof M>(type: K, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void;
    dispatchEvent<K extends keyof M>(event: M[K]): boolean;
    removeEventListener<K extends keyof M>(type: K, callback: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean): void;
}
export type BMLBrowserEventTarget = CustomEventTarget<BMLBrowserEventMap>;
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
     * chain is `"丸ゴシック", "PH Latin", "BML Fallback", monospace` — every step is at the BML cell,
     * so layout does not move. Not registering it is harmless (as before).
     */
    fallback?: BMLBrowserFontFace;
    /**
     * C13, the M+ stack's last resort: the face tried after `fallback` and before `monospace`, for a
     * character neither the primary nor `MPLUS1P` has. With the all-M+ configuration that is Kosugi
     * (`霾`, U+972D, is the one corpus character only it has).
     */
    lastResort?: BMLBrowserFontFace;
};
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
    /** C15: the NVRAM area size the host asked for, null for the table default. */
    private readonly nvramAreaBytes;
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
export type { TextCoding } from "./arib_text";
export { PH_AREAS, ZONE_MASK, REGION_MASK, areaByCode, areaName, isZone, isRegion, areaCovers, areaRelevant } from "./area_code";
export type { AreaCode } from "./area_code";
//# sourceMappingURL=bml_browser.d.ts.map