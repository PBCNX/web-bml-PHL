import { ResponseMessage } from "../server/ws_api";
import { decodeARIBText, type TextCoding } from "./arib_text";
import type { AudioOutput } from "./audio_output";
import { findVideoElement } from "./media_type";
import { describeConfiguration, type ConfigurationSnapshot } from "./configuration";
import { JST_OFFSET_MINUTES } from "./time_offset";
import { BroadcasterDatabase } from "./broadcaster_database";
import { BrowserAPI } from "./browser";
import { Content, keyCodeToAribKey, AribKeyCode, type PageInspection } from "./content";
import { EventDispatcher, EventQueue } from "./event_queue";
import { BML } from "./interface/DOM";
import { ES2Interpreter } from "./interpreter/es2_interpreter";
import { Interpreter } from "./interpreter/interpreter";
import { type BeventRecord, type LockRecord, type ScriptRecord, type TableRecord } from "./introspection";
import { NVRAM } from "./nvram";
import { Resources, type ResourcesDescription } from "./resource";
import { Logger, type LogLevel as LoggerLogLevel } from "./util/logger";
import { OverlayInputApplication } from "./overlay_input";
import { playRomSound } from "./romsound";

/**
 * P1: the snapshot `BMLBrowser#getDiagnostics()` returns. Plain JSON — NaN is null, no class
 * instances, no DOM nodes — so a host can stringify it, log it, or send it over a pipe.
 */
export type DiagnosticsSnapshot = {
    version: 1,
    /** performance.now() at the snapshot */
    at: number,
    /** one line, meant for a status bar: phase, what is pending and why, and what failed */
    summary: string,
    /**
     * P2: the receiver's EWBS area code as the host reported it, or null when it reported none.
     * Not the stream's — an area code belongs to the receiver, so this is what the host supplied.
     */
    areaCode: number | null,
    page: PageInspection,
    resources: ResourcesDescription,
    /** The per-host settings that change what a page shows: P7 textCoding, C16 offset, C15 NVRAM, C13 fonts. */
    configuration: ConfigurationSnapshot,
    locks: LockRecord[],
    tables: TableRecord[],
    errors: ScriptRecord[],
    events: BeventRecord[],
    health: {
        pendingByReason: Record<string, number>,
        locksAwaitingEvent: number,
        failedTables: number,
        /** subscribed with a handler, bevent never ran — normal when the host locked first */
        subscriptionsWithNoEvent: number,
        /** a ModuleLocked subscription for a module that is not cached, locked or pending */
        missingModules: string[],
    },
};

export interface AudioNodeProvider {
    getAudioDestinationNode(): AudioNode;
}

class DefaultAudioNodeProvider implements AudioNodeProvider {
    private audioContext: AudioContext = new AudioContext();
    public getAudioDestinationNode(): AudioNode {
        return this.audioContext.destination;
    }
    public destroy(): void {
        this.audioContext.close();
    }
}

export interface Indicator {
    // arib-dc://<..>/以降
    setUrl(name: string, loading: boolean): void;
    // テレビの下の方に出てくるデータ受信中...の表示
    setReceivingStatus(receiving: boolean): void;
    setNetworkingGetStatus(get: boolean): void;
    setNetworkingPostStatus(post: boolean): void;
    // 番組名
    setEventName(eventName: string | null): void;
}

export interface EPG {
    // 指定されたサービスを選局する
    // true: 成功, false: 失敗, never: ページ遷移などで帰らない
    tune?(originalNetworkId: number, transportStreamId: number, serviceId: number): boolean | never;
    // 指定されたサービスを選局して指定されたコンポーネントを表示する
    tuneToComponent?(originalNetworkId: number, transportStreamId: number, serviceId: number, component: string): boolean | never;
}

export interface IP {
    isIPConnected?(): number;
    getConnectionType?(): number;
    transmitTextDataOverIP?(uri: string, body: Uint8Array<ArrayBuffer>): Promise<{ resultCode: number, statusCode: string, response: Uint8Array }>;
    get?(uri: string): Promise<{ response?: Uint8Array<ArrayBuffer>, headers?: Headers, statusCode?: number }>;
    confirmIPNetwork?(destination: string, isICMP: boolean, timeoutMillis: number): Promise<{ success: boolean, ipAddress: string | null, responseTimeMillis: number | null } | null>;
}

export type InputCharacterType = "all" | "number" | "alphabet" | "hankaku" | "zenkaku" | "katakana" | "hiragana";

const hankakuNumber = "0123456789";
const hankakuAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const hankakuSymbol = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const zenkakuHiragana = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわをん";
const zenkakuKatakana = "ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヲン";
const zenkakuNumber = "０１２３４５６７８９";
const zenkakuAlphabet = "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ";
const zenkakuSymbol = "　、。・ー―「」";

export const inputCharacters: Map<InputCharacterType, string> = new Map([
    ["number", hankakuNumber],
    ["alphabet", hankakuAlphabet + hankakuSymbol],
    ["hankaku", hankakuAlphabet + hankakuNumber + hankakuSymbol],
    ["zenkaku", zenkakuHiragana + zenkakuKatakana + zenkakuAlphabet + zenkakuNumber + zenkakuSymbol],
    ["katakana", zenkakuKatakana + zenkakuSymbol],
    ["hiragana", zenkakuHiragana + zenkakuSymbol],
]);

export type InputCancelReason = "other" | "unload" | "readonly" | "blur" | "invisible";

export type InputApplicationLaunchOptions = {
    // 入力できる文字種
    characterType: InputCharacterType,
    // 入力できる文字 undefinedならば制限はない(ただしデータ放送で扱える範囲の文字のみで半角ｶﾀｶﾅなど扱えない文字もある)
    allowedCharacters?: string,
    // 最大文字数
    maxLength: number,
    // 以前入力されていた文字
    value: string,
    inputMode: "text" | "password",
    // 複数行
    multiline: boolean,
    // 文字入力が完了した際に呼ぶコールバック
    callback: (value: string) => void,
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

export type KeyGroup = "basic" | "data-button" | "numeric-tuning" | "other-tuning"
    | "special-1" | "special-2" // Cプロファイル
    ;

export type Profile = "C" | "A" | "BS" | "CS" | "";

interface BMLBrowserEventMap {
    // 読み込まれたとき
    "load": CustomEvent<{ resolution: { width: number, height: number }, displayAspectRatio: { numerator: number, denominator: number }, profile: Profile }>;
    // invisibleが設定されているときtrue
    "invisible": CustomEvent<boolean>;
    /**
     * 動画の位置や大きさが変わった際に呼ばれるイベント
     * invisibleがtrueである場合渡される矩形に関わらず全面に表示する必要がある
     */
    "videochanged": CustomEvent<{ clientRect: { left: number, top: number, right: number, bottom: number }, boundingRect: DOMRect }>;
    "usedkeylistchanged": CustomEvent<{ usedKeyList: Set<KeyGroup> }>;
    "audiostreamchanged": CustomEvent<{ componentId: number, channelId?: number }>;
}

interface CustomEventTarget<M> {
    addEventListener<K extends keyof M>(type: K, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void;
    dispatchEvent<K extends keyof M>(event: M[K]): boolean;
    removeEventListener<K extends keyof M>(type: K, callback: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean): void;
}

export type BMLBrowserEventTarget = CustomEventTarget<BMLBrowserEventMap>;

/* STD-B24 第二分冊(2/2) 第二編 付属2 4.4.8 */
export type BMLBrowserFontFace = { source: string | BufferSource, descriptors?: FontFaceDescriptors | undefined };
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

export const bmlBrowserFontNames = Object.freeze({
    roundGothic: "丸ゴシック",
    boldRoundGothic: "太丸ゴシック",
    squareGothic: "角ゴシック",
    phLatin: "PH Latin",
    fallback: "BML Fallback",
    lastResort: "BML Last Resort",
});

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
    channels?: { [channel: string]: LogChannelOptions };
};

export type BMLBrowserOptions = {
    // 親要素
    containerElement: HTMLElement;
    // 動画の要素
    mediaElement: HTMLElement;
    // 番組名などを表示
    indicator?: Indicator;
    fonts?: BMLBrowserFonts;
    // localStorageのprefix (default: "")
    storagePrefix?: string;
    // nvramのprefix (default: "nvram_")
    nvramPrefix?: string;
    // 放送者ID DBのprefix (default: "")
    broadcasterDatabasePrefix?: string;
    // フォーカスを受け付けキー入力を受け取る
    tabIndex?: number;
    epg?: EPG;
    /**
     * 動画像プレーンモードを有効化
     * 動画像が配置されている部分が切り抜かれるためvideochangedイベントに合わせて動画を配置する
     */
    videoPlaneModeEnabled?: boolean;
    // 動画プレーンを覆う要素のポインターイベントを通過させる
    tunnelPointerToVideoPlaneEnabled?: boolean;
    audioNodeProvider?: AudioNodeProvider;
    ip?: IP,
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

export class BMLBrowser {
    private containerElement: HTMLElement;
    private shadowRoot: ShadowRoot;
    private documentElement: HTMLElement;
    private interpreter: Interpreter;
    public readonly nvram: NVRAM;
    public readonly browserAPI: BrowserAPI;
    private mediaElement: HTMLElement;
    private resources: Resources;
    private eventQueue: EventQueue;
    private eventDispatcher: EventDispatcher;
    public readonly broadcasterDatabase: BroadcasterDatabase;
    public readonly content: Content;
    private readonly bmlDocument: BML.BMLDocument;
    private indicator?: Indicator;
    private eventTarget: BMLBrowserEventTarget = new EventTarget();
    private fonts: FontFace[] = [];
    private readonly epg: EPG;
    private readonly defaultAudioNodeProvider?: DefaultAudioNodeProvider;
    private readonly areaCodeOption?: number | null | (() => number | null);
    /** C15: the NVRAM area size the host asked for, null for the table default. */
    private readonly nvramAreaBytes: number | null = null;
    public constructor(options: BMLBrowserOptions) {
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
        function setupLogger(channel: string): Logger {
            return new Logger(`${options.log?.prefix ?? "[web-bml]"}[${channel}] `, options.log?.channels?.[channel]?.level ?? options.log?.level);
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
        this.interpreter = new ES2Interpreter(interpreterLogger, browserLogger);
        this.eventQueue = new EventQueue(this.interpreter, eventQueueLogger);
        this.resources = new Resources(this.indicator, options.ip ?? {}, resourcesLogger);
        this.resources.textCoding = options.textCoding ?? "auto";
        this.resources.timeZoneOffsetMinutes = options.timeZoneOffsetMinutes ?? null;
        this.resources.audioOutput = options.audioOutput ?? null;
        this.nvramAreaBytes = options.nvramAreaBytes ?? null;
        this.broadcasterDatabase = new BroadcasterDatabase(this.resources, broadcasterDatabaseLogger, (options.storagePrefix ?? "") + (options.broadcasterDatabasePrefix ?? ""));
        this.broadcasterDatabase.openDatabase();
        this.nvram = new NVRAM(this.resources, this.broadcasterDatabase, nvramLogger, (options.storagePrefix ?? "") + (options.nvramPrefix ?? "nvram_"), {
            areaBytes: options.nvramAreaBytes,
            affiliationBytes: options.nvramAffiliationBytes,
            broadcasterBytes: options.nvramBroadcasterBytes,
        });
        this.bmlDocument = new BML.BMLDocument(this.documentElement, this.interpreter, this.eventQueue, this.resources, this.eventTarget, audioNodeProvider, options.inputApplication, options.setMainAudioStreamCallback, domLogger);
        this.eventDispatcher = new EventDispatcher(this.eventQueue, this.bmlDocument, this.resources, eventLogger);
        this.eventQueue.dispatchBlur = this.eventDispatcher.dispatchBlur.bind(this.eventDispatcher);
        this.eventQueue.dispatchClick = this.eventDispatcher.dispatchClick.bind(this.eventDispatcher);
        this.eventQueue.dispatchFocus = this.eventDispatcher.dispatchFocus.bind(this.eventDispatcher);
        this.eventQueue.dispatchChange = this.eventDispatcher.dispatchChange.bind(this.eventDispatcher);
        this.content = new Content(
            this.bmlDocument,
            this.documentElement,
            this.resources,
            this.eventQueue,
            this.eventDispatcher,
            this.interpreter,
            this.mediaElement,
            this.eventTarget,
            this.indicator,
            options.videoPlaneModeEnabled ?? false,
            options.tunnelPointerToVideoPlaneEnabled ?? false,
            options.inputApplication,
            options.showErrorMessage,
            contentLogger,
        );
        this.browserAPI = new BrowserAPI(this.resources, this.eventQueue, this.eventDispatcher, this.content, this.nvram, this.interpreter, audioNodeProvider, options.ip ?? {}, this.indicator, options.ureg, options.greg, options.X_DPA_startResidentApp, browserLogger);
        this.interpreter.setupEnvironment(this.browserAPI, this.resources, this.content, this.epg);
        if (options.fonts?.roundGothic) {
            this.fonts.push(new FontFace(bmlBrowserFontNames.roundGothic, options.fonts?.roundGothic.source, options.fonts?.roundGothic.descriptors));
        }
        if (options.fonts?.boldRoundGothic) {
            this.fonts.push(new FontFace(bmlBrowserFontNames.roundGothic, options.fonts?.boldRoundGothic.source, { ...options.fonts?.boldRoundGothic.descriptors, weight: "bold" }));
            this.fonts.push(new FontFace(bmlBrowserFontNames.boldRoundGothic, options.fonts?.boldRoundGothic.source, options.fonts?.boldRoundGothic.descriptors));
        } else if (options.fonts?.roundGothic) {
            this.fonts.push(new FontFace(bmlBrowserFontNames.boldRoundGothic, options.fonts?.roundGothic.source, options.fonts?.roundGothic.descriptors));
        }
        if (options.fonts?.squareGothic) {
            this.fonts.push(new FontFace(bmlBrowserFontNames.squareGothic, options.fonts?.squareGothic.source, options.fonts?.squareGothic.descriptors));
        }
        // P13/C13: the PH Latin fallback, registered only when the host supplies it. The default CSS
        // names the family after the BML one, so a page's `ñ` takes this face instead of `monospace`.
        if (options.fonts?.phLatin) {
            this.fonts.push(new FontFace(bmlBrowserFontNames.phLatin, options.fonts.phLatin.source, options.fonts.phLatin.descriptors));
        }
        // C13: the all-M+ fallback (M PLUS 1p), for the ranges M PLUS 1 Code cannot draw.
        if (options.fonts?.fallback) {
            this.fonts.push(new FontFace(bmlBrowserFontNames.fallback, options.fonts.fallback.source, options.fonts.fallback.descriptors));
        }
        // C13: the M+ stack's last resort (Kosugi), for a character neither of the other two has.
        if (options.fonts?.lastResort) {
            this.fonts.push(new FontFace(bmlBrowserFontNames.lastResort, options.fonts.lastResort.source, options.fonts.lastResort.descriptors));
        }
        for (const font of this.fonts) {
            document.fonts.add(font);
        }
    }

    public emitMessage(msg: ResponseMessage) {
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
    public getDiagnostics(): DiagnosticsSnapshot {
        const diagnostics = this.resources.diagnostics;
        const page = this.content.inspect();
        const resources = this.resources.describe();
        const locks = diagnostics.describeLocks();
        const tables = diagnostics.describeTables();
        const errors = diagnostics.describeScripts();

        const pendingByReason: Record<string, number> = {};
        for (const pending of resources.pending) {
            pendingByReason[pending.reason] = (pendingByReason[pending.reason] ?? 0) + 1;
        }
        const locksAwaitingEvent = locks.filter(lock =>
            (lock.api === "lockModuleOnMemory" || lock.api === "lockModuleOnMemoryEx") && lock.moduleLockedEvent == null && lock.outcome !== "failed-after-request").length;
        // A subscription that has never fired is *normal* when the host locked the module before
        // the page subscribed — the bevent was dispatched and nothing was listening yet. What is
        // not normal is a ModuleLocked subscription naming a module the engine neither has nor is
        // waiting for: that one can never fire, and the page will wait on it for ever.
        const available = new Set<string>();
        for (const module of resources.cached) {
            available.add(`/${module.componentId.toString(16).padStart(2, "0")}/${module.moduleId.toString(16).padStart(4, "0")}`);
        }
        for (const module of resources.locked) {
            available.add(`/${module.componentId.toString(16).padStart(2, "0")}/${module.moduleId.toString(16).padStart(4, "0")}`);
        }
        const pendingModules = new Set(resources.pending.map(pending => pending.module));
        const missingModules: string[] = [];
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
        const parts: string[] = [`${page.phase}${page.document == null ? "" : " " + page.document}`];
        if (page.detail != null) {
            parts.push(page.detail);
        }
        if (resources.pending.length === 0) {
            parts.push("nothing pending");
        } else {
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
            configuration: describeConfiguration({
                textCoding: this.resources.textCoding,
                hostOffsetMinutes: this.resources.timeZoneOffsetMinutes,
                streamOffsetMinutes: this.resources.streamTimeOffsetMinutes,
                defaultOffsetMinutes: JST_OFFSET_MINUTES,
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
    public getAreaCode(): number | null {
        const source = this.areaCodeOption;
        const value = typeof source === "function" ? source() : source;
        if (value == null || !Number.isFinite(value)) {
            return null;
        }
        const code = Number(value);
        return Number.isInteger(code) && code >= 0 && code <= 0xfff ? code : null;
    }

    public addEventListener<K extends keyof BMLBrowserEventMap>(type: K, callback: (this: undefined, evt: BMLBrowserEventMap[K]) => void, options?: AddEventListenerOptions | boolean) {
        this.eventTarget.addEventListener(type, callback as EventListener, options);
    }

    public removeEventListener<K extends keyof BMLBrowserEventMap>(type: K, callback: (this: undefined, evt: BMLBrowserEventMap[K]) => void, options?: AddEventListenerOptions | boolean) {
        this.eventTarget.removeEventListener(type, callback as EventListener, options);
    }

    public getVideoElement(): HTMLElement | null {
        return findVideoElement(this.documentElement) as HTMLElement | null;
    }

    public async destroy(): Promise<void> {
        for (const font of this.fonts) {
            document.fonts.delete(font);
        }
        this.fonts.length = 0;
        await this.content.exitDocument();
        if (this.defaultAudioNodeProvider != null) {
            this.defaultAudioNodeProvider.destroy();
        }
    }

    public setMainAudioStream(componentId: number, channelId?: number): void {
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

export { keyCodeToAribKey, AribKeyCode };
export { OverlayInputApplication };
export { playRomSound };
export { decodeARIBText };
export type { TextCoding } from "./arib_text";
export { PH_AREAS, ZONE_MASK, REGION_MASK, areaByCode, areaName, isZone, isRegion, areaCovers, areaRelevant } from "./area_code";
export type { AreaCode } from "./area_code";
