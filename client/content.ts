import css from "css";
import { Resources, CachedFile, CachedFileMetadata } from "./resource";
import { Profile, profileLetter } from "./profile";
import { broadcastWallClockToUnixMillis, parseBroadcastWallClock } from "./time_offset";
import { findVideoElement } from "./media/media_type";
import { defaultCLUT } from "./css/default_clut";
import { readCLUT } from "./css/clut";
import { transpileCSS } from "./css/transpile_css";
import { BML } from "./dom/bml_dom";
import { bmlToXHTMLFXP } from "./bml_to_xhtml";
import { NPTReference, ResponseMessage } from "../protocol/messages";
import { EventDispatcher, EventQueue } from "./event_queue";
import { Interpreter } from "./interpreter/interpreter";
import { BMLBrowserEventTarget, Indicator, InputApplication, KeyGroup } from "./contracts";
import { formatModuleRef, parseUsedKeyList } from "./format";
import { convertJPEG } from "./media/arib_jpeg";
import { getDeclaredTextDecoder } from "./text";
import { DRCSGlyphs } from "./media/drcs";
import { type Logger } from "./util/logger";

import { defaultCSS } from "./css/default_css";
import { defaultCProfileCSS } from "./css/default_c_css";

export enum AribKeyCode {
    Up = 1,
    Down = 2,
    Left = 3,
    Right = 4,
    Digit0 = 5,
    Digit1 = 6,
    Digit2 = 7,
    Digit3 = 8,
    Digit4 = 9,
    Digit5 = 10,
    Digit6 = 11,
    Digit7 = 12,
    Digit8 = 13,
    Digit9 = 14,
    Digit10 = 15,
    Digit11 = 16,
    Digit12 = 17,
    Enter = 18,
    Back = 19, // X
    DataButton = 20,
    BlueButton = 21, // B
    RedButton = 22, // R
    GreenButton = 23, // G
    YellowButton = 24, // Y
    DataButton1 = 25, // E
    DataButton2 = 26, // F
    Bookmark = 100,
    // Cプロファイル
    TVLink = 100,
    // Cプロファイル *
    Star = 101,
    // Cプロファイル #
    Hash = 102,
}

// TR-B14 第二分冊 5.3.1 表5-5参照
const keyCodeToKeyGroup = new Map<AribKeyCode, KeyGroup>([
    [AribKeyCode.Up, "basic"],
    [AribKeyCode.Down, "basic"],
    [AribKeyCode.Left, "basic"],
    [AribKeyCode.Right, "basic"],
    [AribKeyCode.Enter, "basic"],
    [AribKeyCode.Back, "basic"],
    [AribKeyCode.BlueButton, "data-button"],
    [AribKeyCode.RedButton, "data-button"],
    [AribKeyCode.GreenButton, "data-button"],
    [AribKeyCode.YellowButton, "data-button"],
    [AribKeyCode.Bookmark, "data-button"],
    [AribKeyCode.Digit0, "numeric-tuning"],
    [AribKeyCode.Digit1, "numeric-tuning"],
    [AribKeyCode.Digit2, "numeric-tuning"],
    [AribKeyCode.Digit3, "numeric-tuning"],
    [AribKeyCode.Digit4, "numeric-tuning"],
    [AribKeyCode.Digit5, "numeric-tuning"],
    [AribKeyCode.Digit6, "numeric-tuning"],
    [AribKeyCode.Digit7, "numeric-tuning"],
    [AribKeyCode.Digit8, "numeric-tuning"],
    [AribKeyCode.Digit9, "numeric-tuning"],
    [AribKeyCode.Digit10, "numeric-tuning"],
    [AribKeyCode.Digit11, "numeric-tuning"],
    [AribKeyCode.Digit12, "numeric-tuning"],
]);

// TR-B14 第三分冊 7.3.1 表7-2参照
const keyCodeToKeyGroupCProfile = new Map<AribKeyCode, KeyGroup>([
    [AribKeyCode.Enter, "basic"],
    [AribKeyCode.Back, "basic"],
    [AribKeyCode.Digit0, "numeric-tuning"],
    [AribKeyCode.Digit1, "numeric-tuning"],
    [AribKeyCode.Digit2, "numeric-tuning"],
    [AribKeyCode.Digit3, "numeric-tuning"],
    [AribKeyCode.Digit4, "numeric-tuning"],
    [AribKeyCode.Digit5, "numeric-tuning"],
    [AribKeyCode.Digit6, "numeric-tuning"],
    [AribKeyCode.Digit7, "numeric-tuning"],
    [AribKeyCode.Digit8, "numeric-tuning"],
    [AribKeyCode.Digit9, "numeric-tuning"],
    [AribKeyCode.Star, "special-1"],
    [AribKeyCode.Hash, "special-1"],
    [AribKeyCode.TVLink, "special-2"],
]);

const keyCodeToAccessKey = new Map<AribKeyCode, string>([
    [AribKeyCode.Back, "X"],
    [AribKeyCode.BlueButton, "B"],
    [AribKeyCode.RedButton, "R"],
    [AribKeyCode.GreenButton, "G"],
    [AribKeyCode.YellowButton, "Y"],
    [AribKeyCode.DataButton1, "E"],
    [AribKeyCode.DataButton2, "F"],
]);

export function keyCodeToAribKey(keyCode: string): AribKeyCode | -1 {
    // STD B-24 第二分冊(2/2) 第二編 A2 Table 5-9
    switch (keyCode) {
        case "ArrowUp":
            return AribKeyCode.Up;
        case "ArrowDown":
            return AribKeyCode.Down;
        case "ArrowLeft":
            return AribKeyCode.Left;
        case "ArrowRight":
            return AribKeyCode.Right;
        case "0":
            return AribKeyCode.Digit0;
        case "1":
            return AribKeyCode.Digit1;
        case "2":
            return AribKeyCode.Digit2;
        case "3":
            return AribKeyCode.Digit3;
        case "4":
            return AribKeyCode.Digit4;
        case "5":
            return AribKeyCode.Digit5;
        case "6":
            return AribKeyCode.Digit6;
        case "7":
            return AribKeyCode.Digit7;
        case "8":
            return AribKeyCode.Digit8;
        case "9":
            return AribKeyCode.Digit9;
        case "Enter":
        case "Space":
            return AribKeyCode.Enter;
        case "Backspace":
        case "X":
        case "x":
            return AribKeyCode.Back;
        case "D":
        case "d":
            return AribKeyCode.DataButton;
        case "B":
        case "b":
            return AribKeyCode.BlueButton;
        case "R":
        case "r":
            return AribKeyCode.RedButton;
        case "G":
        case "g":
            return AribKeyCode.GreenButton;
        case "Y":
        case "y":
            return AribKeyCode.YellowButton;
        case "E":
        case "e":
            return AribKeyCode.DataButton1;
        case "F":
        case "f":
            return AribKeyCode.DataButton2;
        default:
            return -1;
    }
}

type KeyProcessStatus = {
    keyCode: AribKeyCode,
    isAccessKey: boolean,
};

function requestAnimationFrameAsync(): Promise<void> {
    return new Promise<void>((resolve, _) => {
        requestAnimationFrame((_time) => resolve());
    });
}

type NPT = {
    nptReference: number,
    stcReference: number,
    scaleDenominator: number,
    scaleNumerator: number,
};

/**
 * P6: the charset a resource declares in its media type, if it declares one.
 *
 * This is where the declaration actually lives — the carousel's MIME parameters, not the XML
 * prologue — so a page whose prologue says `UTF-8` and whose MIME says `charset=UTF-8` agrees with
 * itself, and one that says nothing falls back to the profile exactly as before.
 */
function charsetOf(file: CachedFile | null | undefined): string | null {
    const parameters = file?.contentType?.parameters;
    if (parameters == null) {
        return null;
    }
    for (const parameter of parameters) {
        if (String(parameter.attribute ?? "").toLowerCase() === "charset") {
            return parameter.value ?? null;
        }
    }
    return null;
}

export type LaunchDocumentOptions = {
    withLink?: boolean,
};

/** P1: what a page is subscribed to, and whether each subscription has ever fired. */
export type BeitemInspection = {
    type: string,
    /** module_ref or es_ref, as written in the markup */
    ref: string | null,
    subscribe: boolean,
    hasHandler: boolean,
    /** how many bevent handlers of this type have been invoked for this ref */
    fired: number,
};

export type PageInspection = {
    document: string | null,
    requested: string | null,
    phase: string,
    phaseAgeMs: number,
    detail: string | null,
    /** the `resolution` the document declared, and the box the engine then laid out */
    resolution: { declared: string | null, width: number, height: number, displayAspectRatio: string | null } | null,
    profile: string,
    /** true while the body still carries arib-loading: the engine is mid-parse */
    bodyLoading: boolean,
    /** the entry module has been delivered and startup was launched */
    startupDelivered: boolean,
    invisible: boolean | undefined,
    elements: number,
    beitems: BeitemInspection[],
};

/**
 * Host-supplied policy for a single document: video-plane behaviour, key-input routing, error
 * display and logging. Grouped into one object so the two adjacent booleans cannot be swapped by
 * position, and so a new option does not lengthen the positional constructor.
 */
export interface ContentOptions {
    /** Whether the receiver exposes a video plane at all. */
    videoPlaneModeEnabled: boolean;
    /** Whether pointer input is tunnelled into the video plane instead of the document. */
    tunnelPointerToVideoPlaneEnabled: boolean;
    /** The key-input sink for the application layer, when the host installs one. */
    inputApplication?: InputApplication;
    /** Host error display; defaults to the built-in on-screen message. */
    showErrorMessage?: (title: string, message: string, code?: string) => void;
    logger: Logger;
}

export class Content {
    private documentElement: HTMLElement;
    private resources: Resources;
    private eventQueue: EventQueue;
    private eventDispatcher: EventDispatcher;
    private interpreter: Interpreter;
    public readonly bmlDocument: BML.BMLDocument;
    private videoContainer: HTMLElement;
    private bmlEventTarget: BMLBrowserEventTarget;
    private indicator?: Indicator;
    private fonts: FontFace[] = [];
    private readonly videoPlaneModeEnabled: boolean;
    private readonly tunnelPointerToVideoPlaneEnabled: boolean;
    private loaded = false;
    /** P1: 起動の世代番号 (Content#startupDelivered と合わせて読み込み状態を表す) */
    private launchToken = 0;
    private readonly inputApplication?: InputApplication;
    private npt?: NPT;
    private uaStyle?: HTMLStyleElement;
    private readonly showErrorMessage: (title: string, message: string, code?: string) => void;
    private readonly logger: Logger;
    public constructor(
        bmlDocument: BML.BMLDocument,
        documentElement: HTMLElement,
        resources: Resources,
        eventQueue: EventQueue,
        eventDispatcher: EventDispatcher,
        interpreter: Interpreter,
        videoContainer: HTMLElement,
        bmlEventTarget: BMLBrowserEventTarget,
        indicator: Indicator | undefined,
        options: ContentOptions,
    ) {
        this.bmlDocument = bmlDocument;
        this.documentElement = documentElement;
        this.resources = resources;
        this.eventQueue = eventQueue;
        this.eventDispatcher = eventDispatcher;
        this.interpreter = interpreter;
        this.videoContainer = videoContainer;
        this.bmlEventTarget = bmlEventTarget;
        this.indicator = indicator;
        this.videoPlaneModeEnabled = options.videoPlaneModeEnabled;
        this.tunnelPointerToVideoPlaneEnabled = options.tunnelPointerToVideoPlaneEnabled;
        this.inputApplication = options.inputApplication;
        this.showErrorMessage = options.showErrorMessage ?? this.defaultShowErrorMessage.bind(this);
        this.logger = options.logger;

        this.documentElement.addEventListener("keydown", (event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }
            const k = keyCodeToAribKey(event.key);
            if (k == -1) {
                return;
            }
            event.preventDefault();
            this.processKeyDown(k);
        });

        this.documentElement.addEventListener("keyup", (event) => {
            const k = keyCodeToAribKey(event.key);
            if (k == -1) {
                return;
            }
            if (!event.altKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
            }
            this.processKeyUp(k);
        });

        this.resources.addEventListener("dataeventchanged", async (event) => {
            const { component, returnToEntryFlag } = event.detail;
            this.logger.debug(`DataEventChanged`, event.detail);
            const { moduleId, componentId } = this.resources.parseURLEx(this.resources.activeDocument);
            if (moduleId == null || componentId == null) {
                return;
            }
            // 現在視聴中のコンポーネントまたはエントリコンポーネント(固定)かつ引き戻しフラグであればスタートアップ文書を起動
            const returnToEntry = (component.componentId === resources.startupComponentId && returnToEntryFlag);
            if (!returnToEntry && component.componentId !== componentId) {
                return;
            }
            this.eventQueue.queueGlobalAsyncEvent(async () => {
                if (component.componentId === componentId) {
                    // Exは運用されない
                    const moduleLocked = this.documentElement.querySelectorAll("beitem[type=\"DataEventChanged\"]");
                    for (const elem of Array.from(moduleLocked)) {
                        const beitem = BML.nodeToBMLNode(elem, this.bmlDocument) as BML.BMLBeitemElement;
                        if (!beitem.subscribe) {
                            continue;
                        }
                        const onoccur = elem.getAttribute("onoccur");
                        if (onoccur == null) {
                            continue;
                        }
                        this.eventDispatcher.setCurrentBeventEvent({
                            type: "DataEventChanged",
                            target: elem as HTMLElement,
                            status: component.modules.size === 0 ? 1 : 0,
                        });
                        if (await this.eventQueue.executeEventHandler(onoccur)) {
                            return true;
                        }
                        this.eventDispatcher.resetCurrentEvent();
                    }
                    // 提示中のコンポーネントでのデータイベントの更新があった場合lockModuleOnMemoryとlockModuleOnMemoryExでロックしたモジュールのロックが解除される TR-B14 第二分冊 表5-11
                    this.resources.unlockModules();
                };
                if (component.componentId === componentId || returnToEntry) {
                    if (returnToEntry) {
                        // 引き戻しフラグによるエントリコンポーネントへの遷移の場合lockModuleOnMemoryでロックしたモジュールのロックが解除される TR-B14 第二分冊 表5-11
                        this.resources.unlockModules("lockModuleOnMemory");
                    }
                    this.logger.error(`launch startup (DataEventChanged)`);
                    this.runLifecycle("launchStartup(DataEventChanged)", this.launchStartup());
                    return true;
                }
                return false;
            });
            this.eventQueue.processEventQueue();
        });

        this.resources.addEventListener("moduleupdated", (event) => {
            const { componentId, moduleId } = event.detail;
            if (this.resources.activeDocument == null) {
                if (componentId === this.resources.startupComponentId && moduleId === this.resources.startupModuleId) {
                    if (!this.loaded) {
                        this.loaded = true;
                        this.resources.getProgramInfoAsync().then((info) => {
                            if (info != null) {
                                this.runLifecycle("launchStartup(moduleupdated)", this.launchStartup());
                            }
                        });
                    }
                }
            }
        });

        this.resources.addEventListener("componentupdated", (event) => {
            const { component } = event.detail;
            for (const beitem of this.documentElement.querySelectorAll("beitem[type=\"ModuleUpdated\"][subscribe=\"subscribe\"]")) {
                const bmlBeitem = BML.nodeToBMLNode(beitem, this.bmlDocument) as BML.BMLBeitemElement;
                bmlBeitem.internalDIIUpdated(component.componentId, component.modules, component.dataEventId);
            }
        });

        // TR-B14 第二分冊 2.1.10.3 PMT更新時の受信機動作
        this.resources.addEventListener("pmtupdated", (event) => {
            const { components, prevComponents } = event.detail;
            const { componentId: currentComponentId } = this.resources.parseURLEx(this.resources.activeDocument);
            for (const beitem of this.documentElement.querySelectorAll("beitem[type=\"ModuleUpdated\"][subscribe=\"subscribe\"]")) {
                const bmlBeitem = BML.nodeToBMLNode(beitem, this.bmlDocument) as BML.BMLBeitemElement;
                bmlBeitem.internalPMTUpdated(new Set(components.keys()));
            }
            if (currentComponentId == null) {
                return;
            }
            // 視聴中のコンポーネントが消滅 (currentComponentId is known non-null here)
            if (!components.has(currentComponentId)) {
                this.eventQueue.queueGlobalAsyncEvent(async () => {
                    this.resources.unlockModules();
                    this.runLifecycle("launchStartup(component removed)", this.launchStartup());
                    return true;
                });
                this.eventQueue.processEventQueue();
                return;
            }
            const prevPID = prevComponents.get(currentComponentId)?.pid;
            const currentPID = components.get(currentComponentId)?.pid;
            const prevEntryPID = prevComponents.get(this.resources.startupComponentId)?.pid;
            const currentEntryPID = components.get(this.resources.startupComponentId)?.pid;
            // 視聴中のコンポーネントのPIDが変化
            if ((prevPID != null && prevPID !== currentPID) ||
                // 引き戻しフラグ監視中のデータカルーセルを伝送するコンポーネントのPIDが変化
                (prevEntryPID != null && prevEntryPID !== currentEntryPID)) {
                // エントリコンポーネントが消滅
                if (currentEntryPID == null) {
                    this.runLifecycle("exitDocument(entry component gone)", this.exitDocument());
                    return;
                }
                this.logger.error(`PID changed`, prevPID, currentPID, prevEntryPID, currentEntryPID);
                this.eventQueue.queueGlobalAsyncEvent(async () => {
                    this.resources.unlockModules();
                    this.resources.clearCache();
                    this.runLifecycle("launchStartup(PID changed)", this.launchStartup());
                    return true;
                });
                this.eventQueue.processEventQueue();
            }
        });
    }

    /**
     * P6: decode with the charset the resource declares, falling back to the profile's default.
     *
     * `file` is optional because one caller has no resource at all — an event message's private data
     * — and that is text the *stream* defined, not a document that carries a declaration.
     */
    private decodeText(input: Uint8Array, file?: CachedFile | null): string {
        return getDeclaredTextDecoder(this.resources.profile, charsetOf(file))(input);
    }

    private _currentDateMode: number = 0;
    public set currentDateMode(timeMode: number) {
        this._currentDateMode = timeMode;
    }

    public get currentDateMode(): number {
        return this._currentDateMode;
    }

    private getBody() {
        return this.documentElement.querySelector("body");
    }

    private tunnelPointerToVideoPlane() {
        const body = this.getBody()!;
        const videoElement = findVideoElement(body);
        if (videoElement == null) {
            return;
        }
        const videoElem = videoElement as HTMLElement;
        // 自身と親を除外
        const excludes = new Set<Element>();
        let videoLeft = 0;
        let videoTop = 0;
        for (let parent: HTMLElement | null = videoElem; parent != null && parent !== body; parent = parent.parentElement) {
            videoLeft += parent.offsetLeft;
            videoTop += parent.offsetTop;
            excludes.add(parent);
        }
        // 子を除外
        videoElem.querySelectorAll("div, p, object").forEach(element => {
            excludes.add(element);
        });
        // 非除外要素のうち動画プレーンと重なるもののポインターイベントを通過させる
        body.querySelectorAll("div, p, object").forEach(element => {
            if (!excludes.has(element)) {
                const elem = element as HTMLElement;
                let left = 0;
                let top = 0;
                for (let parent: HTMLElement | null = elem; parent != null && parent !== body; parent = parent.parentElement) {
                    left += parent.offsetLeft;
                    top += parent.offsetTop;
                }
                if (videoLeft < left + elem.clientWidth && left < videoLeft + videoElem.clientWidth &&
                    videoTop < top + elem.clientHeight && top < videoTop + videoElem.clientHeight) {
                    elem.style.pointerEvents = "none";
                }
            }
        });
    }

    private clipVideoPlane(videoElement: Element | null) {
        const body = this.getBody()!;
        body.style.background = "transparent";
        body.style.setProperty("background", "transparent", "important");
        const aribBG = document.createElement("arib-bg");
        body.insertAdjacentElement("afterbegin", aribBG);
        type Rect = { left: number, right: number, top: number, bottom: number };
        function getRect(baseElement: HTMLElement, elem: HTMLElement): Rect {
            let left = 0;
            let top = 0;
            let element: HTMLElement | null = elem;
            while (element != null && element !== baseElement) {
                left += element.offsetLeft;
                top += element.offsetTop;
                element = element.parentElement;
            }
            return { left, top, right: left + elem.clientWidth, bottom: top + elem.clientHeight };
        }
        function intersectRect(rect1: Rect, rect2: Rect): Rect | null {
            if (rect1.left < rect2.right && rect2.left < rect1.right && rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
                const left = Math.max(rect1.left, rect2.left);
                const right = Math.min(rect1.right, rect2.right);
                const top = Math.max(rect1.top, rect2.top);
                const bottom = Math.min(rect1.bottom, rect2.bottom);
                return { left, top, right, bottom };
            } else {
                return null;
            }
        }
        if (videoElement != null) {
            const bgJpegs: HTMLElement[] = Array.from(body.querySelectorAll("object[arib-type=\"image/jpeg\"]")).filter(x => {
                return (x.compareDocumentPosition(videoElement) & Node.DOCUMENT_POSITION_FOLLOWING) === Node.DOCUMENT_POSITION_FOLLOWING;
            }) as HTMLElement[];
            let prevRect: Rect | undefined = undefined;
            const changed = () => {
                // transformの影響を受けないbodyからの相対座標を算出
                const body = this.getBody()!;
                const videoRect = getRect(body, videoElement as HTMLElement);
                const clipPath = `polygon(0% 0%, 0% 100%, ${videoRect.left}px 100%, ${videoRect.left}px ${videoRect.top}px, ${videoRect.right}px ${videoRect.top}px, ${videoRect.right}px ${videoRect.bottom}px, ${videoRect.left}px ${videoRect.bottom}px, ${videoRect.left}px 100%, 100% 100%, 100% 0%)`;
                aribBG.style.clipPath = clipPath;
                for (const bgJpeg of bgJpegs) {
                    const jpegRect = getRect(body, bgJpeg);
                    const intersect = intersectRect(videoRect, jpegRect);
                    if (intersect != null) {
                        intersect.left -= jpegRect.left;
                        intersect.right -= jpegRect.left;
                        intersect.top -= jpegRect.top;
                        intersect.bottom -= jpegRect.top;
                        bgJpeg.style.clipPath = `polygon(0% 0%, 0% 100%, ${intersect.left}px 100%, ${intersect.left}px ${intersect.top}px, ${intersect.right}px ${intersect.top}px, ${intersect.right}px ${intersect.bottom}px, ${intersect.left}px ${intersect.bottom}px, ${intersect.left}px 100%, 100% 100%, 100% 0%)`;
                    } else {
                        bgJpeg.style.clipPath = "";
                    }
                }
                if (prevRect == null || videoRect.left !== prevRect.left || videoRect.right !== prevRect.right || videoRect.top !== prevRect.top || videoRect.bottom !== prevRect.bottom) {
                    prevRect = videoRect;
                    this.bmlEventTarget.dispatchEvent<"videochanged">(new CustomEvent("videochanged", { detail: { boundingRect: videoElement.getBoundingClientRect(), clientRect: videoRect } }));
                }
            };
            const observer = new MutationObserver(changed);
            // 一応left, top, width, heightにはinheritが指定される可能性があるため親要素も監視する必要がある
            function observe(target: Node) {
                do {
                    observer.observe(target, { attributes: true, attributeFilter: ["style", "web-bml-state"] });
                    if (target.parentNode == null) {
                        break;
                    }
                    target = target.parentNode;
                } while (target !== body);
            }
            observe(videoElement);
            for (const bgJpeg of bgJpegs) {
                observe(bgJpeg);
            }
            changed();
        }
    }

    private replaceTextCDATA(element: Node, result: Element[]) {
        element.childNodes.forEach(e => {
            if (e.nodeType === Node.COMMENT_NODE) {
                return;
            }
            if (e.nodeType === Node.TEXT_NODE || e.nodeType === Node.CDATA_SECTION_NODE) {
                result.push(e as Element);
            } else {
                if (e.nodeName.toLowerCase() !== "object") {
                    this.replaceTextCDATA(e, result);
                }
            }
        });
    }

    private async loadDocumentToDOM(data: string): Promise<void> {
        if (this.uaStyle == null) {
            this.uaStyle = document.createElement("style");
            this.uaStyle.textContent = this.resources.profile === Profile.TrProfileC ? defaultCProfileCSS : defaultCSS;
            this.documentElement.parentNode?.prepend(this.uaStyle);
        }
        const xhtmlDocument = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja"></html>`, "application/xhtml+xml");
        const documentElement = xhtmlDocument.createElement("html");
        // This innerHTML is not an XSS vector and must not be sanitised: a BML browser exists to parse
        // the page markup it is sent. The element belongs to a detached DOMParser document (nothing
        // executes there), and bmlToXHTMLFXP has already renamed <script>/<style>/<link> to arib-*,
        // which the engine interprets itself rather than the browser. Sanitising would delete the
        // page.
        documentElement.innerHTML = bmlToXHTMLFXP(data, this.resources.profile === Profile.TrProfileC);
        const p = Array.from(this.documentElement.childNodes).filter(x => x.nodeName.toLowerCase() === "body" || x.nodeName.toLowerCase() === "head");
        const videoElementNew = findVideoElement(documentElement);
        const prevBody = this.getBody();
        const newBody = documentElement.querySelector("body")!;
        prevBody?.setAttribute("arib-loading", "arib-loading");
        newBody.setAttribute("arib-loading", "arib-loading");
        for (const style of Array.from(documentElement.querySelectorAll("arib-style, arib-link"))) {
            if (style.nodeName.toLowerCase() === "arib-link") {
                const href = style.getAttribute("href");
                if (href != null) {
                    const newStyle = document.createElement("style");
                    const res = await this.resources.fetchResourceAsync(href);
                    if (res != null) {
                        newStyle.textContent = await transpileCSS(this.decodeText(res.data, res), { inline: false, clutReader: this.getCLUT.bind(this), convertUrl: this.convertCSSUrl.bind(this) });
                        style.parentElement?.appendChild(newStyle);
                    }
                }
            } else if (style.textContent) {
                const newStyle = document.createElement("style");
                newStyle.textContent = await transpileCSS(style.textContent, { inline: false, clutReader: this.getCLUT.bind(this), convertUrl: this.convertCSSUrl.bind(this) });
                style.parentElement?.appendChild(newStyle);
            }
        }

        for (const style of Array.from(documentElement.querySelectorAll("[style]"))) {
            const styleAttribute = style.getAttribute("style");
            if (!styleAttribute) {
                continue;
            }
            style.setAttribute("style", await transpileCSS(styleAttribute, { inline: true, clutReader: this.getCLUT.bind(this), convertUrl: this.convertCSSUrl.bind(this) }));
        }

        this.documentElement.append(...Array.from(documentElement.children));

        if (videoElementNew != null) {
            videoElementNew.appendChild(this.videoContainer);
        }
        newBody.removeAttribute("arib-loading");
        for (const n of p) {
            n.remove();
        }
        const t: Element[] = [];
        this.replaceTextCDATA(newBody, t);
        let observe = false;
        for (const e of t) {
            const cd = BML.nodeToBMLNode(e, this.bmlDocument) as unknown as BML.CharacterData;
            if (cd.internalReflow()) {
                observe = true;
            }
        }
        if (observe) {
            const observer = new MutationObserver((recs) => {
                for (const rec of recs) {
                    (rec.target as Element).querySelectorAll("arib-text, arib-cdata").forEach(elem => {
                        const cd = BML.nodeToBMLNode(elem, this.bmlDocument) as unknown as BML.CharacterData;
                        cd.internalReflow();
                    });
                }
            });
            observer.observe(newBody, {
                attributeFilter: ["style", "web-bml-state"],
                attributes: true,
                subtree: true,
            });
        }

        if (this.videoPlaneModeEnabled) {
            this.clipVideoPlane(videoElementNew);
        }
    }

    private focusHelper(element?: HTMLElement | null) {
        if (element == null) {
            return;
        }
        const felem = BML.htmlElementToBMLHTMLElement(element, this.bmlDocument);
        if (felem && (felem as any).focus) {
            (felem as any).focus();
        }
    }

    public unloadAllDRCS() {
        this.bmlDocument.internalUnloadAllDRCS();
        for (const font of this.fonts) {
            document.fonts.delete(font);
        }
        this.fonts.length = 0;
    }

    private _context: any = {};

    public get context() {
        return this._context;
    }

    private async unloadDocument() {
        // スクリプトが呼ばれているときにさらにスクリプトが呼ばれることはないがonunloadだけ例外
        this.interpreter.resetStack();
        const body = this.getBody();
        const onunload = body?.getAttribute("arib-onunload");
        if (onunload != null) {
            this.eventDispatcher.setCurrentEvent({
                target: body,
                type: "unload",
            });
            if (await this.eventQueue.executeEventHandler(onunload)) {
                // readPersistentArray writePersistentArray unlockModuleOnMemoryEx unlockAllModulesOnMemoryしか呼び出せないので終了したらおかしい
                this.logger.error(`onunload`);
                return true;
            }
            this.eventDispatcher.resetCurrentEvent();
        }
        this.inputApplication?.cancel("unload");
        this.interpreter.reset();
        this.currentDateMode = 0;
        this.keyProcessStatus = undefined;
        this.npt = undefined;
    }

    // データ放送番組でなくなったときなど
    public async exitDocument() {
        await this.unloadDocument();
        this.eventQueue.reset();
        this.resources.abandonPendingProgramInfo("document exited");
        this.unloadAllDRCS();
        this.resources.unlockModules();
        this._context = { from: this.resources.activeDocument, to: null };
        this.resources.activeDocument = null;
        this.resources.diagnostics.setPhase(++this.launchToken, "exited", null, null);
        this.bmlEventTarget.dispatchEvent<"invisible">(new CustomEvent("invisible", { detail: true }));
        const p = Array.from(this.documentElement.childNodes).filter(x => x.nodeName.toLowerCase() === "body" || x.nodeName.toLowerCase() === "head");
        for (const n of p) {
            n.remove();
        }
        this.loaded = false;
    }

    public async quitDocument() {
        this.resources.unlockModules();
        await this.launchStartup();
    }

    // 5.14.12.2 受信機の動作失敗時のガイドライン
    // 8.3.11.4 受信機の動作失敗時のガイドライン
    public fail(title: string, message: string, code?: string): Promise<void> {
        this.showErrorMessage(title, message, code);
        return this.quitDocument();
    }

    private isFocusable(element: HTMLElement): boolean {
        if (!BML.isFocusable(element)) {
            return false;
        }
        if (this.resources.profile === Profile.TrProfileC) {
            // STD-B24 第二分冊(2/2) 付属4 5.1.6
            const focusable = element.nodeName.toLowerCase() === "a" || element.nodeName.toLowerCase() === "input" || element.nodeName.toLowerCase() === "textarea" || element.hasAttribute("onclick") || element.hasAttribute("onfocus") || element.hasAttribute("onblur") || element.hasAttribute("onkeydown") || element.hasAttribute("onkeyup");
            if (!focusable) {
                return false;
            }
            const { width, height } = element.getBoundingClientRect();
            if (width === 0 || height === 0) {
                return false;
            }
        }
        return true;
    }

    private focusFirstNavIndex() {
        for (let i = 0; ; i++) {
            const element = this.findNavIndex(i);
            if (element == null) {
                break;
            }
            if (this.isFocusable(element)) {
                this.focusHelper(element);
                break;
            }
        }
    }

    // Cプロファイルでは受信機が適切にナビゲーションを行う (STD-B24 第二分冊 (2/2) 5.1.6 フォーカスの運用)
    // nav-indexを使って再現する
    private shimCProfileNavigation() {
        if (this.resources.profile !== Profile.TrProfileC) {
            return;
        }
        this.documentElement.querySelectorAll("a, input, textarea, [onclick], [onfocus], [onblur], [onkeydown], [onkeyup]").forEach((element, i) => {
            const htmlElement = element as HTMLElement;
            htmlElement.style.setProperty("--nav-index", `${i}`);
            if (i !== 0) {
                htmlElement.style.setProperty("--nav-up", `${i - 1}`);
                htmlElement.style.setProperty("--nav-left", `${i - 1}`);
            }
            htmlElement.style.setProperty("--nav-down", `${i + 1}`);
            htmlElement.style.setProperty("--nav-right", `${i + 1}`);
        });
    }

    private async loadDocument(file: CachedFile, documentName: string, token: number): Promise<boolean> {
        // A throw anywhere below would leave the phase at "parsing" with nothing in the scripts
        // list, which is exactly the "why is this page stuck?" question the diagnostics exist for.
        try {
            return await this.loadDocumentInner(file, documentName, token);
        } catch (e) {
            this.logger.error(`loadDocument failed`, documentName, e);
            this.resources.diagnostics.scriptError("run", documentName, e);
            this.resources.diagnostics.setPhase(token, "failed", this.resources.activeDocument, documentName, e instanceof Error ? e.message : String(e));
            return false;
        }
    }

    private async loadDocumentInner(file: CachedFile, documentName: string, token: number): Promise<boolean> {
        await this.unloadDocument();
        this._context = { from: this.resources.activeDocument, to: documentName };
        this.resources.diagnostics.setPhase(token, "parsing", documentName, documentName);
        this.bmlDocument._currentFocus = null;
        // 提示中の文書と同一サービス内の別コンポーネントへの遷移の場合lockModuleOnMemoryでロックしたモジュールのロックは解除される TR-B14 第二分冊 表5-11
        const { componentId: nextComponent } = this.resources.parseURLEx(documentName);
        const { componentId: prevComponent } = this.resources.parseURLEx(this.resources.activeDocument);
        if (prevComponent !== nextComponent) {
            this.resources.unlockModules("lockModuleOnMemory");
        }
        this.resources.activeDocument = documentName;
        await requestAnimationFrameAsync();
        await this.loadDocumentToDOM(this.decodeText(file.data, file));
        this.loadObjects();
        this.eventQueue.reset();
        this.unloadAllDRCS();
        let width: number = 960;
        let height: number = 540;
        const body = this.getBody()!;
        const bmlBody = BML.nodeToBMLNode(body, this.bmlDocument) as BML.BMLBodyElement;
        const bodyStyle = window.getComputedStyle(body);
        const resolution = bodyStyle.getPropertyValue("--resolution").trim();
        const displayAspectRatio = bodyStyle.getPropertyValue("--display-aspect-ratio").trim();
        let aspectNum = 16;
        let aspectDen = 9;
        if (resolution === "720x480") {
            if (displayAspectRatio === "4v3") {
                [width, height] = [720, 480];
                aspectNum = 4;
                aspectDen = 3;
            } else {
                [width, height] = [720, 480];
            }
        } else if (resolution === "240x480") {
            [width, height] = [240, 480];
            aspectNum = 1;
            aspectDen = 2;
        }
        // P1/P4: ページが宣言した解像度そのもの。ホストが「960x540で描いた」ではなく
        // 「720x480と宣言された」を読めるようにする
        this.resources.diagnostics.setResolution(resolution.length === 0 ? null : resolution, width, height, displayAspectRatio.length === 0 ? null : displayAspectRatio);


        this.bmlEventTarget.dispatchEvent<"load">(new CustomEvent("load", {
            detail: {
                resolution: { width, height },
                displayAspectRatio: { numerator: aspectNum, denominator: aspectDen },
                profile: profileLetter(this.resources.profile),
            }
        }));
        body.style.maxWidth = width + "px";
        body.style.minWidth = width + "px";
        body.style.maxHeight = height + "px";
        body.style.minHeight = height + "px";
        this.documentElement.style.maxWidth = width + "px";
        this.documentElement.style.minWidth = width + "px";
        this.documentElement.style.maxHeight = height + "px";
        this.documentElement.style.minHeight = height + "px";
        bmlBody.internalDispatchInvisible();
        const usedKeyList = bodyStyle.getPropertyValue("--used-key-list");
        this.bmlEventTarget.dispatchEvent<"usedkeylistchanged">(new CustomEvent("usedkeylistchanged", {
            detail: {
                usedKeyList: parseUsedKeyList(usedKeyList)
            }
        }));
        // フォーカスはonloadの前に当たるがonloadが実行されるまではイベントは実行されない
        // STD-B24 第二分冊(2/2) 第二編 付属1 5.1.3参照
        this.resources.diagnostics.setPhase(token, "running", documentName, documentName);
        this.eventQueue.lockSyncEventQueue();
        let exit = false;
        let scriptCount = 0;
        try {
            if (this.resources.profile === Profile.TrProfileC) {
                this.shimCProfileNavigation();
                this.focusFirstNavIndex();
            } else {
                this.focusHelper(this.findNavIndex(0));
            }
            this.eventDispatcher.resetCurrentEvent();
            for (const x of Array.from(this.documentElement.querySelectorAll("arib-script"))) {
                const src = x.getAttribute("src");
                if (src) {
                    const res = await this.resources.fetchResourceAsync(src);
                    if (res !== null) {
                        if (exit = await this.interpreter.addScript(this.decodeText(res.data, res), src)) {
                            return true;
                        }
                    }
                } else if (x.textContent != null) {
                    scriptCount++;
                    if (exit = await this.interpreter.addScript(x.textContent, `${this.resources.activeDocument ?? ""}[${scriptCount}]`)) {
                        return true;
                    }
                }
            }
            const body = this.getBody();
            const onload = body?.getAttribute("arib-onload");
            if (onload != null) {
                this.eventDispatcher.setCurrentEvent({
                    target: body,
                    type: "load",
                });
                if (exit = await this.eventQueue.executeEventHandler(onload)) {
                    return true;
                }
                this.eventDispatcher.resetCurrentEvent();
            }
            for (const beitem of this.documentElement.querySelectorAll("beitem[subscribe=\"subscribe\"]")) {
                const bmlBeitem = BML.nodeToBMLNode(beitem, this.bmlDocument) as BML.BMLBeitemElement;
                // The attribute is the state, so re-arming is a direct call rather than an
                // assignment that reads from the property it writes.
                bmlBeitem.internalSetSubscribe(true);
            }
        } finally {
            if (!exit) {
                this.eventQueue.unlockSyncEventQueue();
            }
        }
        if (await this.eventQueue.processEventQueue()) {
            return true;
        }
        if (this.tunnelPointerToVideoPlaneEnabled) {
            this.tunnelPointerToVideoPlane();
        }
        this.indicator?.setUrl(this.resources.activeDocument.replace(/(^https?:\/\/)[^/]+/, (_, g: string) => g + "…"), false);
        // P1: ここまで来たら描画とスクリプトは終わっている。以降ページが止まっているなら
        // 原因は読み込みではなく、待っているもの (ロック/表/イベント) の側にある
        this.resources.diagnostics.setPhase(token, "ready", documentName, documentName);
        return false;
    }

    private processTimerEvent() {
        const timerFired = this.documentElement.querySelectorAll("beitem[type=\"TimerFired\"]");
        timerFired.forEach(elem => {
            const beitem = BML.nodeToBMLNode(elem, this.bmlDocument) as BML.BMLBeitemElement;
            if (!beitem.subscribe) {
                return;
            }
            if (beitem.internalTimerFired) {
                return;
            }
            const timeValue = beitem.timeValue;
            if (beitem.timeMode === "absolute" || beitem.timeMode === "origAbsolute") {
                if (timeValue.length !== 14) {
                    return;
                }
                const clock = parseBroadcastWallClock(timeValue);
                if (clock == null) {
                    return;
                }
                // C16: the page's absolute time is in the broadcast local time, which the stream
                // declares in its TOT (PH +8, Japan +9); assuming JST put every PH timer an hour off.
                const jstTime = broadcastWallClockToUnixMillis({ ...clock, offsetMinutes: this.resources.localTimeOffsetMinutes });
                if (this.resources.currentTimeUnixMillis != null && jstTime <= this.resources.currentTimeUnixMillis) {
                    beitem.internalTimerFired = true;
                    this.eventDispatcher.dispatchTimerFiredEvent(0, elem);
                }
            } else if (beitem.timeMode === "NPT") {
                // NPTが不定の時にsubscribeされたときは微妙
                const npt = Number.parseInt(timeValue);
                if (Number.isNaN(npt) || this.npt == null) {
                    return;
                }
                const currentNPT = this.getNPT90kHz();
                if (currentNPT == null) {
                    return;
                }
                if (npt <= currentNPT / 90) {
                    beitem.internalTimerFired = true;
                    this.eventDispatcher.dispatchTimerFiredEvent(0, elem);
                }
            }
        });
    }

    private async launchStartup(): Promise<boolean> {
        const module = `arib-dc://-1.-1.-1${formatModuleRef(this.resources.startupComponentId, this.resources.startupModuleId)}`;
        await this.resources.fetchResourceAsync(module);
        if (this.resources.fetchLockedResource(module + "/startup.bml")) {
            await this.launchDocument(module + "/startup.bml");
            return true;
        } else if (this.resources.fetchLockedResource(module)) {
            await this.launchDocument(module);
            return true;
        } else {
            await this.exitDocument();
        }
        return false;
    }

    /**
     * Whether the pressed key belongs to a key group the page enabled through `--used-key-list`.
     * `none` disables everything; an empty list leaves only the basic and data-button groups live
     * (STD-B24 第二分冊(2/2) 第二編 付属1 5.1.3).
     */
    private isKeyGroupEnabled(key: AribKeyCode): boolean {
        const body = this.getBody();
        if (body == null) {
            return false;
        }
        const usedKeyList = window.getComputedStyle(body).getPropertyValue("--used-key-list").split(" ").filter(x => x.length);
        if (usedKeyList.length > 0 && usedKeyList[0] === "none") {
            return false;
        }
        const keyGroup = (this.resources.profile === Profile.TrProfileC ? keyCodeToKeyGroupCProfile : keyCodeToKeyGroup).get(key);
        if (keyGroup == null) {
            return false;
        }
        if (usedKeyList.length === 0) {
            return keyGroup === "basic" || keyGroup === "data-button";
        }
        return usedKeyList.some(x => x === keyGroup);
    }

    /**
     * Runs one event handler with the synchronous queue locked. Returns true when the handler
     * reported that execution ended (a navigation): the lock is then left held, because the
     * incoming document owns the queue from that point.
     */
    private async runHandlerLocked(handler: string): Promise<boolean> {
        let exit = false;
        try {
            this.eventQueue.lockSyncEventQueue();
            exit = await this.eventQueue.executeEventHandler(handler);
            return exit;
        } finally {
            if (!exit) {
                this.eventQueue.unlockSyncEventQueue();
            }
        }
    }

    /**
     * Runs a lifecycle step started from a listener or queued callback and records a failure.
     * Without this an unexpected throw becomes an unhandled rejection that no diagnostics entry
     * ever mentions, which is exactly the "page is stuck and nothing says why" case.
     */
    private runLifecycle(step: string, action: Promise<unknown>): void {
        action.catch((e) => {
            this.logger.error(`lifecycle step failed`, step, e);
            this.resources.diagnostics.scriptError("run", step, e);
        });
    }

    /**
     * Starts a document transition; the promise settles when the new document has been launched.
     * The ARIB-facing callers cannot await it — they throw to unwind the interpreter — so they
     * attach a catch, which keeps a failed launch from becoming an unhandled rejection.
     */
    public async launchDocument(documentName: string, options?: LaunchDocumentOptions): Promise<void> {
        const withLink = options?.withLink ?? false;
        this.logger.log(`launchDocument`, documentName);
        // P1: この起動の世代。入れ子の遷移が起きたら、外側の遅れて届いた書き込みは捨てる
        const token = ++this.launchToken;
        this.eventQueue.discard();
        const { component, module, filename } = this.resources.parseURL(documentName);
        const componentId = Number.parseInt(component ?? "", 16);
        const moduleId = Number.parseInt(module ?? "", 16);
        let normalizedDocument: string;
        if (!Number.isInteger(componentId) || !Number.isInteger(moduleId)) {
            const isInternet = documentName.startsWith("http://") || documentName.startsWith("https://");
            if (isInternet && (!this.resources.isInternetContent || (this.resources.profile === Profile.TrProfileC && withLink))) {
                // 放送コンテンツ->通信コンテンツへの遷移
                this.resources.setBaseURIDirectory(documentName);
                normalizedDocument = documentName;
            } else if (this.resources.activeDocument != null && this.resources.isInternetContent) {
                // 通信コンテンツ->通信コンテンツへの遷移
                if (!this.resources.checkBaseURIDirectory(documentName)) {
                    // A 5.14.7 通信コンテンツのスコープのマッピング リンク状態特有の通信コンテンツの制約 ※2
                    // > 受信機が非リンクを搭載していない場合、再選局相当の動作を行なう、または、遷移を行わずにリンク状態を継続する
                    // C 8.3.11.4 受信機の動作失敗時のガイドライン
                    // > ベースURIディレクトリに合致しないURIが指定された場合は、データ放送ブラウザは失敗動作とし、受信機はエラーメッセージを表示する
                    this.logger.error(`base URI directory violation`);
                    this.resources.diagnostics.setPhase(token, "failed", this.resources.activeDocument, documentName, "base URI directory violation (E402)");
                    await this.fail("エラー", "ベースURIディレクトリエラー", "E402");
                    return;
                }
                normalizedDocument = new URL(documentName, this.resources.activeDocument).toString();
            } else {
                this.logger.error(`failed to fetch document`, documentName);
                this.resources.diagnostics.setPhase(token, "failed", this.resources.activeDocument, documentName, "not a carousel path, and internet content is not allowed here");
                await this.quitDocument();
                return;
            }
            this.resources.invalidateRemoteCache(documentName);
        } else if (filename != null) {
            normalizedDocument = `${formatModuleRef(componentId, moduleId)}/${filename}`;
        } else {
            normalizedDocument = formatModuleRef(componentId, moduleId);
        }
        this.indicator?.setUrl(normalizedDocument.replace(/(^https?:\/\/)[^/]+/, (_, g: string) => g + "…"), true);
        this.resources.diagnostics.setPhase(token, "fetching", this.resources.activeDocument, normalizedDocument);
        const res = await this.resources.fetchResourceAsync(documentName);
        if (res == null) {
            this.resources.diagnostics.setPhase(token, "failed", this.resources.activeDocument, normalizedDocument, "document not found");
            this.logger.error(`NOT FOUND`);
            // fail() already performs the quit transition; awaiting it and then quitting again
            // started the startup transition twice on a failed fetch.
            if (normalizedDocument.startsWith("http")) {
                await this.fail("ネットワークエラー", "文書の取得に失敗しました", "E400");
            } else {
                await this.quitDocument();
            }
            return;
        }
        const ad = this.resources.activeDocument;
        await this.loadDocument(res, normalizedDocument, token);
        this.logger.debug(`return `, ad, documentName);
        return;
    }

    private findNavIndex(navIndex: number): HTMLElement | undefined {
        return Array.from(this.documentElement.querySelectorAll("*")).find(elem => {
            return parseInt(window.getComputedStyle(elem).getPropertyValue("--nav-index")) == navIndex;
        }) as (HTMLElement | undefined);
    }

    private keyProcessStatus?: KeyProcessStatus;

    public processKeyDown(k: AribKeyCode) {
        if (k === AribKeyCode.DataButton) {
            // データボタンの場合DataButtonPressedのみが発生する
            this.eventDispatcher.dispatchDataButtonPressedEvent();
            return;
        }
        if (this.keyProcessStatus != null) {
            return;
        }
        const keyProcessStatus: KeyProcessStatus = {
            keyCode: k,
            isAccessKey: false,
        };
        this.keyProcessStatus = keyProcessStatus;
        let focusElement = this.bmlDocument.currentFocus?.["node"];
        if (this.resources.profile === Profile.TrProfileC) {
            if (k == AribKeyCode.Left || k == AribKeyCode.Right || k == AribKeyCode.Up || k == AribKeyCode.Down) {
                if (focusElement == null) {
                    this.focusFirstNavIndex();
                } else {
                    this.focusNextNavIndex(k, focusElement);
                }
                this.eventQueue.processEventQueue();
                return;
            }
        }
        if (focusElement instanceof HTMLInputElement) {
            const inputMode = focusElement.getAttribute("inputmode");
            if (inputMode !== "direct" && inputMode !== "indirect") {
                // FIXME: changeイベントをフォーカス移動の際に発生させる (STD-B24 第二分冊(2/2) 5.3.1.3)
                if (k >= AribKeyCode.Digit0 && k <= AribKeyCode.Digit9) {
                    const num = (k - AribKeyCode.Digit0).toString();
                    if (focusElement.maxLength > focusElement.value.length) {
                        focusElement.value += num;
                    }
                } else if (k === AribKeyCode.Back) {
                    if (focusElement.value.length >= 1) {
                        focusElement.value = focusElement.value.substring(0, focusElement.value.length - 1);
                    }
                }
            }
        }
        if (!this.isKeyGroupEnabled(k)) {
            return;
        }
        focusElement = this.bmlDocument.currentFocus?.["node"];
        const target = focusElement;
        this.eventQueue.queueAsyncEvent(async () => {
            const onkeydown = target?.getAttribute("onkeydown");
            if (target != null && onkeydown) {
                this.eventDispatcher.setCurrentIntrinsicEvent({
                    keyCode: k as number,
                    type: "keydown",
                    target,
                });
                if (await this.runHandlerLocked(onkeydown)) {
                    return true;
                }
                this.eventDispatcher.resetCurrentEvent();
            }
            // STD-B24 第二分冊 (2/2) 第二編 付属1 5.4.2.3参照
            const accessKey = keyCodeToAccessKey.get(k);
            if (accessKey != null) {
                const elem = this.documentElement.querySelector(`[accesskey="${accessKey}"]`) as HTMLElement;
                if (elem != null && this.isFocusable(elem)) {
                    this.focusHelper(elem);
                    this.logger.warn(`accesskey is half implemented.`);
                    // [6] 疑似的にkeyup割り込み事象が発生 keyCode = アクセスキー
                    const onkeyup = elem.getAttribute("onkeyup");
                    if (onkeyup != null) {
                        this.eventDispatcher.setCurrentIntrinsicEvent({
                            keyCode: k as number,
                            type: "keyup",
                            target: elem,
                        });
                        if (await this.runHandlerLocked(onkeyup)) {
                            return true;
                        }
                        this.eventDispatcher.resetCurrentEvent();
                    }
                    // [6] 疑似的にkeydown割り込み事象が発生 keyCode = 決定キー
                    const onkeydown = elem.getAttribute("onkeydown");
                    if (onkeydown != null) {
                        this.eventDispatcher.setCurrentIntrinsicEvent({
                            // A local rather than reassigning `k`: rewriting the parameter meant every
                            // later branch saw Enter instead of the key the user actually pressed.
                            keyCode: AribKeyCode.Enter as number,
                            type: "keydown",
                            target: elem,
                        });
                        if (await this.runHandlerLocked(onkeydown)) {
                            return true;
                        }
                        this.eventDispatcher.resetCurrentEvent();
                    }
                    keyProcessStatus.isAccessKey = true;
                }
            }
            focusElement = this.bmlDocument.currentFocus?.["node"];
            if (focusElement) {
                // [4] A'に対してnavigation関連特性を適用
                this.focusNextNavIndex(k, focusElement);
            }
            const currentFocus = this.bmlDocument.currentFocus;
            if (k == AribKeyCode.Enter && currentFocus) {
                focusElement = currentFocus["node"];
                currentFocus.internalSetActive(true);
                this.eventQueue.queueSyncEvent({ type: "click", target: focusElement });
                if (this.bmlDocument.currentFocus instanceof BML.BMLInputElement) {
                    const inputMode = focusElement.getAttribute("inputmode");
                    if (inputMode === "indirect") {
                        this.bmlDocument.currentFocus.internalLaunchInputApplication();
                    } else if (this.resources.profile === Profile.TrProfileC) {
                        this.bmlDocument.currentFocus.internalLaunchInputApplication();
                    }
                }
                if (currentFocus instanceof BML.BMLAnchorElement && currentFocus.href != "") {
                    const href = currentFocus.href;
                    if (!href.startsWith("#")) {
                        // The document is going away, so this handler cannot act on it; returning true
                        // stops the current page's processing, and a failed launch is logged rather
                        // than becoming an unhandled rejection.
                        this.launchDocument(href).catch((e) => this.logger.error(`launchDocument failed`, href, e));
                        return true;
                    } else {
                        this.focusFragment(href);
                    }
                }
            }
            // [11] accessKeyの場合focusElementに対し決定キーのkeyupを発生させる必要がある
            return false;
        });
        this.eventQueue.processEventQueue();
    }

    private focusNextNavIndex(k: AribKeyCode, focusElement: HTMLElement) {
        let nextFocus = "";
        let nextFocusStyle = window.getComputedStyle(focusElement);
        // Each hop is visited at most once: a --nav-* cycle of non-focusable elements (or an element
        // pointing at itself) used to spin here forever on a keydown, hanging the main thread.
        const visited = new Set<HTMLElement>();
        while (true) {
            if (k == AribKeyCode.Left) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-left");
            } else if (k == AribKeyCode.Right) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-right");
            } else if (k == AribKeyCode.Up) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-up");
            } else if (k == AribKeyCode.Down) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-down");
            }
            const nextFocusIndex = parseInt(nextFocus);
            if (Number.isFinite(nextFocusIndex) && nextFocusIndex >= 0 && nextFocusIndex <= 32767) {
                const next = this.findNavIndex(nextFocusIndex);
                if (next != null && !visited.has(next)) {
                    visited.add(next);
                    nextFocusStyle = window.getComputedStyle(next);
                    // 非表示要素であれば飛ばされる (STD-B24 第二分冊 (1/2 第二編) 5.4.13.3参照)
                    if (!this.isFocusable(next)) {
                        continue;
                    }
                    this.focusHelper(next);
                }
            }
            break;
        }
    }

    public focusFragment(fragment: string): void {
        if (fragment.startsWith("#")) {
            fragment = fragment.substring(1);
        }
        const fragmentElement = this.bmlDocument.getElementById(fragment)?.["node"];
        if (fragmentElement == null) {
            return;
        }
        if (this.isFocusable(fragmentElement)) {
            this.focusHelper(fragmentElement);
        } else {
            // 直接fragmentにフォーカスを当てられなければ後方のフォーカスを当てられる要素に、それでも見つからなければ前方の要素
            const elements = [...this.documentElement.querySelectorAll("*")];
            const fragmentElementIndex = elements.indexOf(fragmentElement);
            for (const element of elements.slice(fragmentElementIndex + 1).concat(elements.slice(0, fragmentElementIndex).reverse())) {
                if (element instanceof HTMLElement) {
                    if (this.isFocusable(element)) {
                        this.focusHelper(element);
                        return;
                    }
                }
            }
        }
    }

    public processKeyUp(k: AribKeyCode) {
        if (k === AribKeyCode.DataButton) {
            return;
        }
        this.eventQueue.queueAsyncEvent(async () => {
            const keyProcessStatus = this.keyProcessStatus;
            if (keyProcessStatus?.keyCode !== k) {
                return false;
            } else {
                this.keyProcessStatus = undefined;
            }
            const currentFocus = this.bmlDocument.currentFocus;
            if (currentFocus == null) {
                return false;
            }
            const focusElement = currentFocus["node"];
            const keyCode = keyProcessStatus.isAccessKey ? AribKeyCode.Enter : k;
            if (keyCode === AribKeyCode.Enter) {
                currentFocus.internalSetFocus(true);
            }
            if (!this.isKeyGroupEnabled(keyCode)) {
                return false;
            }
            const onkeyup = focusElement.getAttribute("onkeyup");
            if (onkeyup) {
                this.eventDispatcher.setCurrentIntrinsicEvent({
                    keyCode,
                    type: "keyup",
                    target: focusElement,
                });
                if (await this.runHandlerLocked(onkeyup)) {
                    return true;
                }
                this.eventDispatcher.resetCurrentEvent();
            }
            return false;
        });
        this.eventQueue.processEventQueue();
    }

    private clutToDecls(table: number[][]): css.Declaration[] {
        const ret: css.Declaration[] = [];
        let i = 0;
        for (const t of table) {
            const decl: css.Declaration = {
                type: "declaration",
                property: "--clut-color-" + i,
                value: `#${t[0].toString(16).padStart(2, "0")}${t[1].toString(16).padStart(2, "0")}${t[2].toString(16).padStart(2, "0")}${(t[3]).toString(16).padStart(2, "0")}`,
            };
            ret.push(decl);
            i++;
        }
        return ret;
    }

    private async getCLUT(clutUrl: string): Promise<css.Declaration[]> {
        const res = await this.resources.fetchResourceAsync(clutUrl);
        let clut = defaultCLUT;
        if (res?.data) {
            clut = readCLUT(res.data, this.logger);
        }
        return this.clutToDecls(clut);
    }

    private async convertCSSUrl(url: string): Promise<CachedFileMetadata | undefined> {
        const res = await this.resources.fetchResourceAsync(url);
        if (!res) {
            return undefined;
        }
        // background-imageはJPEGのみ運用される (STD-B24 第二分冊(2/2) 付属2 4.4.6)
        let bt709 = res.blobUrl.get("BT.709");
        if (bt709 != null) {
            return bt709;
        }
        try {
            const bt601 = await globalThis.createImageBitmap(new Blob([res.data]));
            bt709 = await convertJPEG(bt601);
            res.blobUrl.set("BT.709", bt709);
            return bt709;
        } catch (e) {
            this.logger.error(`failed to decode image`, url, e);
            return undefined;
        }
    }

    private loadObjects() {
        this.documentElement.querySelectorAll("object").forEach(obj => {
            const adata = obj.getAttribute("arib-data");
            BML.nodeToBMLNode(obj, this.bmlDocument).data = adata;
        });
        if (this.resources.profile === Profile.TrProfileC) {
            this.documentElement.querySelectorAll("img").forEach(obj => {
                const asrc = obj.getAttribute("arib-src");
                if (!asrc) {
                    return;
                }
                BML.nodeToBMLNode(obj, this.bmlDocument).src = asrc!;
            });
        }
    }

    pcrBase?: number;

    public getNPT90kHz(): number | null {
        if (this.npt == null || this.pcrBase == null) {
            return null;
        }
        // TR-B14 第二分冊 NPT値算出アルゴリズムを参照
        const STCr = this.npt.stcReference;
        const NPTr = this.npt.nptReference;
        const STCc = this.pcrBase;
        const Wpre = 3888000000;
        const Wpost = 3888000000;
        const STCmax = 0x1FFFFFFFF;
        if ((STCc > STCr && STCc - STCr <= Wpost) || (STCc < STCr && STCc + STCmax - STCr <= Wpost)) {
            if (this.npt.scaleDenominator === 1 && this.npt.scaleNumerator === 1) {
                return (STCc + ((STCmax + NPTr - STCr) % STCmax)) % STCmax;
            } else if (this.npt.scaleDenominator === 1 && this.npt.scaleNumerator === 0) {
                return NPTr;
            } else {
                return null;
            }
        } else if ((STCc > STCr && STCr + STCmax - STCc <= Wpre) || (STCc < STCr && STCr - STCc <= Wpre)) {
            if (this.npt.scaleDenominator === 1 && this.npt.scaleNumerator === 1) {
                return NPTr;
            } else if (this.npt.scaleDenominator === 1 && this.npt.scaleNumerator === 0) {
                return (STCc + ((STCmax + NPTr - STCr) % STCmax)) % STCmax;
            } else {
                return null;
            }
        }
        return null;
    }

    public onMessage(msg: ResponseMessage) {
        if (msg.type === "pcr") {
            this.pcrBase = msg.pcrBase;
            this.processTimerEvent();
        } else if (msg.type === "esEventUpdated") {
            const activeComponentId = this.resources.currentComponentId;
            if (activeComponentId == null) {
                return;
            }
            let queued = false;
            const nptReference = msg.events.find((x): x is NPTReference => x.type === "nptReference");
            if (this.pcrBase != null && nptReference != null) {
                if (this.npt != null || nptReference.STCReference <= this.pcrBase) {
                    const nptChanged = this.npt == null ||
                        this.npt.nptReference !== nptReference.NPTReference || this.npt.stcReference !== nptReference.STCReference ||
                        this.npt.scaleDenominator !== nptReference.scaleDenominator || this.npt.scaleNumerator !== nptReference.scaleNumerator;
                    if (nptChanged) {
                        this.npt = {
                            nptReference: nptReference.NPTReference,
                            stcReference: nptReference.STCReference,
                            scaleDenominator: nptReference.scaleDenominator,
                            scaleNumerator: nptReference.scaleNumerator,
                        };
                        this.logger.debug(`NPTReferred`, this.npt);
                    }
                    const nptReferred = this.documentElement.querySelectorAll("beitem[type=\"NPTReferred\"][subscribe=\"subscribe\"]");
                    for (const beitemNative of Array.from(nptReferred)) {
                        const beitem = BML.nodeToBMLNode(beitemNative, this.bmlDocument) as BML.BMLBeitemElement;
                        if (!beitem.subscribe) {
                            continue;
                        }
                        if (!nptChanged && beitem.internalNPTReferred) {
                            continue;
                        }
                        const es_ref = beitem.esRef;
                        // STD-B24的には未指定の時現在のコンポーネントだけど運用規定的には独立したコンポーネントで伝送される
                        let componentId = activeComponentId;
                        if (es_ref != null) {
                            const esRefComponentId = this.resources.parseURLEx(es_ref).componentId;
                            if (esRefComponentId != null) {
                                componentId = esRefComponentId;
                            }
                        }
                        if (componentId !== msg.componentId) {
                            continue;
                        }
                        beitem.internalNPTReferred = true;
                        const onoccur = beitemNative.getAttribute("onoccur");
                        if (!onoccur) {
                            continue;
                        }
                        this.eventQueue.queueAsyncEvent(async () => {
                            this.eventDispatcher.setCurrentBeventEvent({
                                type: "NPTReferred",
                                target: beitemNative as HTMLElement,
                                status: 0,
                                esRef: es_ref ?? ("/" + componentId.toString(16).padStart(2, "0")),
                            });
                            if (await this.eventQueue.executeEventHandler(onoccur)) {
                                return true;
                            }
                            this.eventDispatcher.resetCurrentEvent();
                            return false;
                        });
                        queued = true;
                    }
                }
            }
            const eventMessageFired = this.documentElement.querySelectorAll("beitem[type=\"EventMessageFired\"][subscribe=\"subscribe\"]");
            eventMessageFired.forEach((beitemNative) => {
                const beitem = BML.nodeToBMLNode(beitemNative, this.bmlDocument) as BML.BMLBeitemElement;
                if (!beitem.subscribe) {
                    return;
                }
                const es_ref = beitem.esRef;
                // message_group_idは0,1のみ運用される
                // 省略時は0
                const message_group_id = beitem.messageGroupId;
                const message_id = beitem.messageId;
                const message_version = beitem.messageVersion;
                const onoccur = beitemNative.getAttribute("onoccur");
                if (!onoccur) {
                    return;
                }
                let componentId = activeComponentId;
                if (es_ref != null) {
                    const esRefComponentId = this.resources.parseURLEx(es_ref).componentId;
                    if (esRefComponentId != null) {
                        componentId = esRefComponentId;
                    }
                }
                if (componentId !== msg.componentId) {
                    return;
                }
                for (const event of msg.events) {
                    if (event.type === "nptEvent") {
                        const currentNPT = this.getNPT90kHz();
                        if (currentNPT == null || event.eventMessageNPT > currentNPT) {
                            continue;
                        }
                    } else if (event.type !== "immediateEvent") {
                        continue;
                    }
                    if (event.eventMessageGroupId !== message_group_id) {
                        continue;
                    }
                    if (event.eventMessageGroupId === 0) {
                        if (this.resources.currentDataEventId !== msg.dataEventId) {
                            continue;
                        }
                    }
                    const eventMessageId = event.eventMessageId >> 8;
                    const eventMessageVersion = event.eventMessageId & 0xff;
                    if (message_id !== 255 && message_id !== eventMessageId) {
                        continue;
                    }
                    if (message_version !== 255 && message_version !== eventMessageVersion) {
                        continue;
                    }
                    if (beitem.internalMessageVersion == null) {
                        beitem.internalMessageVersion = new Map<number, number>();
                    }
                    if (beitem.internalMessageVersion.get(eventMessageId) === eventMessageVersion) {
                        continue;
                    }
                    beitem.internalMessageVersion.set(eventMessageId, eventMessageVersion);
                    const privateData = this.decodeText(Uint8Array.from(event.privateDataByte));
                    this.logger.debug(`EventMessageFired`, eventMessageId, eventMessageVersion, privateData);
                    this.eventQueue.queueAsyncEvent(async () => {
                        this.eventDispatcher.setCurrentBeventEvent({
                            type: "EventMessageFired",
                            target: beitemNative as HTMLElement,
                            status: 0,
                            privateData,
                            esRef: es_ref ?? ("/" + componentId.toString(16).padStart(2, "0")),
                            messageId: eventMessageId,
                            messageVersion: eventMessageVersion,
                            messageGroupId: event.eventMessageGroupId,
                        });
                        if (await this.eventQueue.executeEventHandler(onoccur)) {
                            return true;
                        }
                        this.eventDispatcher.resetCurrentEvent();
                        return false;
                    });
                    queued = true;
                }
            });
            if (queued) {
                this.eventQueue.processEventQueue();
            }
        }
    }

    public loadDRCS(glyphs: DRCSGlyphs[]) {
        this.bmlDocument.internalLoadDRCS(glyphs);
    }

    /**
     * P1: the page as the host can see it — what document is up, what phase it is in, and every
     * beitem subscription with the number of times its handler actually ran. A subscription that
     * has never fired is the single most common reason a page sits on 読み込み中, and before this
     * the host had no way to tell it apart from a page that simply looks like that.
     */
    public inspect(): PageInspection {
        const diagnostics = this.resources.diagnostics;
        const events = diagnostics.describeEvents();
        const key = (ref: string | null): string | null => {
            if (ref == null || ref.length === 0) {
                return null;
            }
            const { componentId, moduleId } = this.resources.parseURLEx(ref);
            return componentId != null && moduleId != null
                ? `${componentId.toString(16)}/${moduleId.toString(16)}`
                : ref.toLowerCase();
        };
        const beitems: BeitemInspection[] = [];
        for (const node of Array.from(this.documentElement.querySelectorAll("beitem"))) {
            const elem = node as HTMLElement;
            const type = elem.getAttribute("type") ?? "";
            const ref = elem.getAttribute("module_ref") ?? elem.getAttribute("es_ref");
            const refKey = key(ref);
            let fired = 0;
            for (const record of events) {
                if (record.type === type && key(record.target) === refKey) {
                    fired++;
                }
            }
            beitems.push({
                type,
                ref,
                subscribe: elem.getAttribute("subscribe") === "subscribe",
                hasHandler: elem.getAttribute("onoccur") != null,
                fired,
            });
        }
        const phase = diagnostics.describePhase();
        const body = this.getBody();
        return {
            document: this.resources.activeDocument,
            requested: phase.requested,
            phase: phase.phase,
            phaseAgeMs: phase.ageMs,
            detail: phase.detail,
            resolution: diagnostics.describeResolution(),
            profile: profileLetter(this.resources.profile),
            bodyLoading: body?.hasAttribute("arib-loading") ?? false,
            startupDelivered: this.loaded,
            invisible: this.invisible,
            elements: this.documentElement.querySelectorAll("*").length,
            beitems,
        };
    }

    public addDRCSFont(font: FontFace) {
        this.fonts.push(font);
        document.fonts.add(font);
    }

    public get invisible(): boolean | undefined {
        const body = this.getBody();
        if (body == null) {
            return undefined;
        }
        return (BML.nodeToBMLNode(body, this.bmlDocument) as BML.BMLBodyElement).invisible;
    }

    private defaultShowErrorMessage(title: string, message: string, code?: string): void {
        const errorDialog = document.createElement("div");
        this.documentElement.parentNode?.append(errorDialog);
        const dialogRoot = errorDialog.attachShadow({ mode: "closed" });
        const dialog = document.createElement("dialog");
        dialogRoot.appendChild(dialog);
        const titleElement = document.createElement("h3");
        const messageElement = document.createElement("p");
        titleElement.textContent = title;
        if (code != null) {
            messageElement.textContent = `${message} (${code})`;
        } else {
            messageElement.textContent = message;
        }
        titleElement.style.whiteSpace = "pre-wrap";
        messageElement.style.whiteSpace = "pre-wrap";
        titleElement.style.overflowWrap = "break-word";
        messageElement.style.overflowWrap = "break-word";
        dialog.append(titleElement, messageElement);
        dialog.showModal();
        window.setTimeout(() => {
            dialog.close();
            errorDialog.remove();
        }, 5000);
    }
}
