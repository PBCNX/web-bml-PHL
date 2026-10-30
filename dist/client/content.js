"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Content = exports.AribKeyCode = void 0;
exports.keyCodeToAribKey = keyCodeToAribKey;
const resource_1 = require("./resource");
const time_offset_1 = require("./time_offset");
const media_type_1 = require("./media_type");
const default_clut_1 = require("./default_clut");
const clut_1 = require("./clut");
const transpile_css_1 = require("./transpile_css");
const DOM_1 = require("./interface/DOM");
const bml_to_xhtml_1 = require("./bml_to_xhtml");
const arib_jpeg_1 = require("./arib_jpeg");
const text_1 = require("./text");
const default_css_1 = require("./default_css");
const default_c_css_1 = require("./default_c_css");
var AribKeyCode;
(function (AribKeyCode) {
    AribKeyCode[AribKeyCode["Up"] = 1] = "Up";
    AribKeyCode[AribKeyCode["Down"] = 2] = "Down";
    AribKeyCode[AribKeyCode["Left"] = 3] = "Left";
    AribKeyCode[AribKeyCode["Right"] = 4] = "Right";
    AribKeyCode[AribKeyCode["Digit0"] = 5] = "Digit0";
    AribKeyCode[AribKeyCode["Digit1"] = 6] = "Digit1";
    AribKeyCode[AribKeyCode["Digit2"] = 7] = "Digit2";
    AribKeyCode[AribKeyCode["Digit3"] = 8] = "Digit3";
    AribKeyCode[AribKeyCode["Digit4"] = 9] = "Digit4";
    AribKeyCode[AribKeyCode["Digit5"] = 10] = "Digit5";
    AribKeyCode[AribKeyCode["Digit6"] = 11] = "Digit6";
    AribKeyCode[AribKeyCode["Digit7"] = 12] = "Digit7";
    AribKeyCode[AribKeyCode["Digit8"] = 13] = "Digit8";
    AribKeyCode[AribKeyCode["Digit9"] = 14] = "Digit9";
    AribKeyCode[AribKeyCode["Digit10"] = 15] = "Digit10";
    AribKeyCode[AribKeyCode["Digit11"] = 16] = "Digit11";
    AribKeyCode[AribKeyCode["Digit12"] = 17] = "Digit12";
    AribKeyCode[AribKeyCode["Enter"] = 18] = "Enter";
    AribKeyCode[AribKeyCode["Back"] = 19] = "Back";
    AribKeyCode[AribKeyCode["DataButton"] = 20] = "DataButton";
    AribKeyCode[AribKeyCode["BlueButton"] = 21] = "BlueButton";
    AribKeyCode[AribKeyCode["RedButton"] = 22] = "RedButton";
    AribKeyCode[AribKeyCode["GreenButton"] = 23] = "GreenButton";
    AribKeyCode[AribKeyCode["YellowButton"] = 24] = "YellowButton";
    AribKeyCode[AribKeyCode["DataButton1"] = 25] = "DataButton1";
    AribKeyCode[AribKeyCode["DataButton2"] = 26] = "DataButton2";
    AribKeyCode[AribKeyCode["Bookmark"] = 100] = "Bookmark";
    // Cプロファイル
    AribKeyCode[AribKeyCode["TVLink"] = 100] = "TVLink";
    // Cプロファイル *
    AribKeyCode[AribKeyCode["Star"] = 101] = "Star";
    // Cプロファイル #
    AribKeyCode[AribKeyCode["Hash"] = 102] = "Hash";
})(AribKeyCode || (exports.AribKeyCode = AribKeyCode = {}));
// TR-B14 第二分冊 5.3.1 表5-5参照
const keyCodeToKeyGroup = new Map([
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
const keyCodeToKeyGroupCProfile = new Map([
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
const keyCodeToAccessKey = new Map([
    [AribKeyCode.Back, "X"],
    [AribKeyCode.BlueButton, "B"],
    [AribKeyCode.RedButton, "R"],
    [AribKeyCode.GreenButton, "G"],
    [AribKeyCode.YellowButton, "Y"],
    [AribKeyCode.DataButton1, "E"],
    [AribKeyCode.DataButton2, "F"],
]);
function keyCodeToAribKey(keyCode) {
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
function requestAnimationFrameAsync() {
    return new Promise((resolve, _) => {
        requestAnimationFrame((_time) => resolve());
    });
}
/**
 * P6: the charset a resource declares in its media type, if it declares one.
 *
 * This is where the declaration actually lives — the carousel's MIME parameters, not the XML
 * prologue — so a page whose prologue says `UTF-8` and whose MIME says `charset=UTF-8` agrees with
 * itself, and one that says nothing falls back to the profile exactly as before.
 */
function charsetOf(file) {
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
class Content {
    documentElement;
    resources;
    eventQueue;
    eventDispatcher;
    interpreter;
    bmlDocument;
    videoContainer;
    bmlEventTarget;
    indicator;
    fonts = [];
    videoPlaneModeEnabled;
    tunnelPointerToVideoPlaneEnabled;
    loaded = false;
    /** P1: 起動の世代番号 (Content#startupDelivered と合わせて読み込み状態を表す) */
    launchToken = 0;
    inputApplication;
    npt;
    uaStyle;
    showErrorMessage;
    logger;
    constructor(bmlDocument, documentElement, resources, eventQueue, eventDispatcher, interpreter, videoContainer, bmlEventTarget, indicator, videoPlaneModeEnabled, tunnelPointerToVideoPlaneEnabled, inputApplication, showErrorMessage, logger) {
        this.bmlDocument = bmlDocument;
        this.documentElement = documentElement;
        this.resources = resources;
        this.eventQueue = eventQueue;
        this.eventDispatcher = eventDispatcher;
        this.interpreter = interpreter;
        this.videoContainer = videoContainer;
        this.bmlEventTarget = bmlEventTarget;
        this.indicator = indicator;
        this.videoPlaneModeEnabled = videoPlaneModeEnabled;
        this.tunnelPointerToVideoPlaneEnabled = tunnelPointerToVideoPlaneEnabled;
        this.inputApplication = inputApplication;
        this.showErrorMessage = showErrorMessage ?? this.defaultShowErrorMessage.bind(this);
        this.logger = logger;
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
            this.logger.debug(`${this.logger.prefix}DataEventChanged`, event.detail);
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
                        const beitem = DOM_1.BML.nodeToBMLNode(elem, this.bmlDocument);
                        if (!beitem.subscribe) {
                            continue;
                        }
                        const onoccur = elem.getAttribute("onoccur");
                        if (onoccur == null) {
                            continue;
                        }
                        this.eventDispatcher.setCurrentBeventEvent({
                            type: "DataEventChanged",
                            target: elem,
                            status: component.modules.size === 0 ? 1 : 0,
                        });
                        if (await this.eventQueue.executeEventHandler(onoccur)) {
                            return true;
                        }
                        this.eventDispatcher.resetCurrentEvent();
                    }
                    // 提示中のコンポーネントでのデータイベントの更新があった場合lockModuleOnMemoryとlockModuleOnMemoryExでロックしたモジュールのロックが解除される TR-B14 第二分冊 表5-11
                    this.resources.unlockModules();
                }
                ;
                if (component.componentId === componentId || returnToEntry) {
                    if (returnToEntry) {
                        // 引き戻しフラグによるエントリコンポーネントへの遷移の場合lockModuleOnMemoryでロックしたモジュールのロックが解除される TR-B14 第二分冊 表5-11
                        this.resources.unlockModules("lockModuleOnMemory");
                    }
                    this.logger.error(`${this.logger.prefix}launch startup (DataEventChanged)`);
                    this.launchStartup();
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
                        this.resources.getProgramInfoAsync().then(_ => this.launchStartup());
                    }
                }
            }
        });
        this.resources.addEventListener("componentupdated", (event) => {
            const { component } = event.detail;
            for (const beitem of this.documentElement.querySelectorAll("beitem[type=\"ModuleUpdated\"][subscribe=\"subscribe\"]")) {
                const bmlBeitem = DOM_1.BML.nodeToBMLNode(beitem, this.bmlDocument);
                bmlBeitem.internalDIIUpdated(component.componentId, component.modules, component.dataEventId);
            }
        });
        // TR-B14 第二分冊 2.1.10.3 PMT更新時の受信機動作
        this.resources.addEventListener("pmtupdated", (event) => {
            const { components, prevComponents } = event.detail;
            const { componentId: currentComponentId } = this.resources.parseURLEx(this.resources.activeDocument);
            for (const beitem of this.documentElement.querySelectorAll("beitem[type=\"ModuleUpdated\"][subscribe=\"subscribe\"]")) {
                const bmlBeitem = DOM_1.BML.nodeToBMLNode(beitem, this.bmlDocument);
                bmlBeitem.internalPMTUpdated(new Set(components.keys()));
            }
            if (currentComponentId == null) {
                return;
            }
            // 視聴中のコンポーネントが消滅
            if (currentComponentId != null && !components.has(currentComponentId)) {
                this.eventQueue.queueGlobalAsyncEvent(async () => {
                    this.resources.unlockModules();
                    this.launchStartup();
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
                    this.exitDocument();
                    return;
                }
                this.logger.error(`${this.logger.prefix}PID changed`, prevPID, currentPID, prevEntryPID, currentEntryPID);
                this.eventQueue.queueGlobalAsyncEvent(async () => {
                    this.resources.unlockModules();
                    this.resources.clearCache();
                    this.launchStartup();
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
    decodeText(input, file) {
        return (0, text_1.getDeclaredTextDecoder)(this.resources.profile, charsetOf(file))(input);
    }
    _currentDateMode = 0;
    set currentDateMode(timeMode) {
        this._currentDateMode = timeMode;
    }
    get currentDateMode() {
        return this._currentDateMode;
    }
    getBody() {
        return this.documentElement.querySelector("body");
    }
    tunnelPointerToVideoPlane() {
        const body = this.getBody();
        const videoElement = (0, media_type_1.findVideoElement)(body);
        if (videoElement == null) {
            return;
        }
        const videoElem = videoElement;
        // 自身と親を除外
        const excludes = new Set();
        let videoLeft = 0;
        let videoTop = 0;
        for (let parent = videoElem; parent != null && parent !== body; parent = parent.parentElement) {
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
                const elem = element;
                let left = 0;
                let top = 0;
                for (let parent = elem; parent != null && parent !== body; parent = parent.parentElement) {
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
    clipVideoPlane(videoElement) {
        const body = this.getBody();
        body.style.background = "transparent";
        body.style.setProperty("background", "transparent", "important");
        const aribBG = document.createElement("arib-bg");
        body.insertAdjacentElement("afterbegin", aribBG);
        function getRect(baseElement, elem) {
            let left = 0;
            let top = 0;
            let element = elem;
            while (element != null && element !== baseElement) {
                left += element.offsetLeft;
                top += element.offsetTop;
                element = element.parentElement;
            }
            return { left, top, right: left + elem.clientWidth, bottom: top + elem.clientHeight };
        }
        function intersectRect(rect1, rect2) {
            if (rect1.left < rect2.right && rect2.left < rect1.right && rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
                const left = Math.max(rect1.left, rect2.left);
                const right = Math.min(rect1.right, rect2.right);
                const top = Math.max(rect1.top, rect2.top);
                const bottom = Math.min(rect1.bottom, rect2.bottom);
                return { left, top, right, bottom };
            }
            else {
                return null;
            }
        }
        if (videoElement != null) {
            const bgJpegs = Array.from(body.querySelectorAll("object[arib-type=\"image/jpeg\"]")).filter(x => {
                return (x.compareDocumentPosition(videoElement) & Node.DOCUMENT_POSITION_FOLLOWING) === Node.DOCUMENT_POSITION_FOLLOWING;
            });
            let prevRect = undefined;
            const changed = () => {
                // transformの影響を受けないbodyからの相対座標を算出
                const body = this.getBody();
                const videoRect = getRect(body, videoElement);
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
                    }
                    else {
                        bgJpeg.style.clipPath = "";
                    }
                }
                if (prevRect == null || videoRect.left !== prevRect.left || videoRect.right !== prevRect.right || videoRect.top !== prevRect.top || videoRect.bottom !== prevRect.bottom) {
                    prevRect = videoRect;
                    this.bmlEventTarget.dispatchEvent(new CustomEvent("videochanged", { detail: { boundingRect: videoElement.getBoundingClientRect(), clientRect: videoRect } }));
                }
            };
            const observer = new MutationObserver(changed);
            // 一応left, top, width, heightにはinheritが指定される可能性があるため親要素も監視する必要がある
            function observe(target) {
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
    replaceTextCDATA(element, result) {
        element.childNodes.forEach(e => {
            if (e.nodeType === Node.COMMENT_NODE) {
                return;
            }
            if (e.nodeType === Node.TEXT_NODE || e.nodeType === Node.CDATA_SECTION_NODE) {
                result.push(e);
            }
            else {
                if (e.nodeName.toLowerCase() !== "object") {
                    this.replaceTextCDATA(e, result);
                }
            }
        });
    }
    async loadDocumentToDOM(data) {
        if (this.uaStyle == null) {
            this.uaStyle = document.createElement("style");
            this.uaStyle.textContent = this.resources.profile === resource_1.Profile.TrProfileC ? default_c_css_1.defaultCProfileCSS : default_css_1.defaultCSS;
            this.documentElement.parentNode?.prepend(this.uaStyle);
        }
        const xhtmlDocument = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja"></html>`, "application/xhtml+xml");
        const documentElement = xhtmlDocument.createElement("html");
        documentElement.innerHTML = (0, bml_to_xhtml_1.bmlToXHTMLFXP)(data, this.resources.profile === resource_1.Profile.TrProfileC);
        const p = Array.from(this.documentElement.childNodes).filter(x => x.nodeName.toLowerCase() === "body" || x.nodeName.toLowerCase() === "head");
        const videoElementNew = (0, media_type_1.findVideoElement)(documentElement);
        const prevBody = this.getBody();
        const newBody = documentElement.querySelector("body");
        prevBody?.setAttribute("arib-loading", "arib-loading");
        newBody.setAttribute("arib-loading", "arib-loading");
        for (const style of Array.from(documentElement.querySelectorAll("arib-style, arib-link"))) {
            if (style.nodeName.toLowerCase() === "arib-link") {
                const href = style.getAttribute("href");
                if (href != null) {
                    const newStyle = document.createElement("style");
                    const res = await this.resources.fetchResourceAsync(href);
                    if (res != null) {
                        newStyle.textContent = await (0, transpile_css_1.transpileCSS)(this.decodeText(res.data, res), { inline: false, clutReader: this.getCLUT.bind(this), convertUrl: this.convertCSSUrl.bind(this) });
                        style.parentElement?.appendChild(newStyle);
                    }
                }
            }
            else if (style.textContent) {
                const newStyle = document.createElement("style");
                newStyle.textContent = await (0, transpile_css_1.transpileCSS)(style.textContent, { inline: false, clutReader: this.getCLUT.bind(this), convertUrl: this.convertCSSUrl.bind(this) });
                style.parentElement?.appendChild(newStyle);
            }
        }
        for (const style of Array.from(documentElement.querySelectorAll("[style]"))) {
            const styleAttribute = style.getAttribute("style");
            if (!styleAttribute) {
                continue;
            }
            style.setAttribute("style", await (0, transpile_css_1.transpileCSS)(styleAttribute, { inline: true, clutReader: this.getCLUT.bind(this), convertUrl: this.convertCSSUrl.bind(this) }));
        }
        this.documentElement.append(...Array.from(documentElement.children));
        if (videoElementNew != null) {
            videoElementNew.appendChild(this.videoContainer);
        }
        newBody.removeAttribute("arib-loading");
        for (const n of p) {
            n.remove();
        }
        const t = [];
        this.replaceTextCDATA(newBody, t);
        let observe = false;
        for (const e of t) {
            const cd = DOM_1.BML.nodeToBMLNode(e, this.bmlDocument);
            if (cd.internalReflow()) {
                observe = true;
            }
        }
        if (observe) {
            const observer = new MutationObserver((recs) => {
                for (const rec of recs) {
                    rec.target.querySelectorAll("arib-text, arib-cdata").forEach(elem => {
                        const cd = DOM_1.BML.nodeToBMLNode(elem, this.bmlDocument);
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
    focusHelper(element) {
        if (element == null) {
            return;
        }
        const felem = DOM_1.BML.htmlElementToBMLHTMLElement(element, this.bmlDocument);
        if (felem && felem.focus) {
            felem.focus();
        }
    }
    unloadAllDRCS() {
        this.bmlDocument.internalUnloadAllDRCS();
        for (const font of this.fonts) {
            document.fonts.delete(font);
        }
        this.fonts.length = 0;
    }
    _context = {};
    get context() {
        return this._context;
    }
    async unloadDocument() {
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
                this.logger.error(`${this.logger.prefix}onunload`);
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
    async exitDocument() {
        await this.unloadDocument();
        this.eventQueue.reset();
        this.unloadAllDRCS();
        this.resources.unlockModules();
        this._context = { from: this.resources.activeDocument, to: null };
        this.resources.activeDocument = null;
        this.resources.diagnostics.setPhase(++this.launchToken, "exited", null, null);
        this.bmlEventTarget.dispatchEvent(new CustomEvent("invisible", { detail: true }));
        const p = Array.from(this.documentElement.childNodes).filter(x => x.nodeName.toLowerCase() === "body" || x.nodeName.toLowerCase() === "head");
        for (const n of p) {
            n.remove();
        }
        this.loaded = false;
    }
    async quitDocument() {
        this.resources.unlockModules();
        await this.launchStartup();
    }
    // 5.14.12.2 受信機の動作失敗時のガイドライン
    // 8.3.11.4 受信機の動作失敗時のガイドライン
    fail(title, message, code) {
        this.showErrorMessage(title, message, code);
        return this.quitDocument();
    }
    isFocusable(element) {
        if (!DOM_1.BML.isFocusable(element)) {
            return false;
        }
        if (this.resources.profile === resource_1.Profile.TrProfileC) {
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
    focusFirstNavIndex() {
        for (let i = 0;; i++) {
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
    shimCProfileNavigation() {
        if (this.resources.profile !== resource_1.Profile.TrProfileC) {
            return;
        }
        this.documentElement.querySelectorAll("a, input, textarea, [onclick], [onfocus], [onblur], [onkeydown], [onkeyup]").forEach((element, i) => {
            const htmlElement = element;
            htmlElement.style.setProperty("--nav-index", `${i}`);
            if (i !== 0) {
                htmlElement.style.setProperty("--nav-up", `${i - 1}`);
                htmlElement.style.setProperty("--nav-left", `${i - 1}`);
            }
            htmlElement.style.setProperty("--nav-down", `${i + 1}`);
            htmlElement.style.setProperty("--nav-right", `${i + 1}`);
        });
    }
    async loadDocument(file, documentName, token) {
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
        this.resources.documentCharset = charsetOf(file);
        await requestAnimationFrameAsync();
        await this.loadDocumentToDOM(this.decodeText(file.data, file));
        this.loadObjects();
        this.eventQueue.reset();
        this.unloadAllDRCS();
        let width = 960;
        let height = 540;
        const body = this.getBody();
        const bmlBody = DOM_1.BML.nodeToBMLNode(body, this.bmlDocument);
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
            }
            else {
                [width, height] = [720, 480];
            }
        }
        else if (resolution === "240x480") {
            [width, height] = [240, 480];
            aspectNum = 1;
            aspectDen = 2;
        }
        // P1/P4: ページが宣言した解像度そのもの。ホストが「960x540で描いた」ではなく
        // 「720x480と宣言された」を読めるようにする
        this.resources.diagnostics.setResolution(resolution.length === 0 ? null : resolution, width, height, displayAspectRatio.length === 0 ? null : displayAspectRatio);
        function mapProfile(profile) {
            switch (profile) {
                case resource_1.Profile.TrProfileA:
                    return "A";
                case resource_1.Profile.TrProfileC:
                    return "C";
                case resource_1.Profile.BS:
                    return "BS";
                case resource_1.Profile.CS:
                    return "CS";
                default:
                    return "";
            }
        }
        this.bmlEventTarget.dispatchEvent(new CustomEvent("load", {
            detail: {
                resolution: { width, height },
                displayAspectRatio: { numerator: aspectNum, denominator: aspectDen },
                profile: mapProfile(this.resources.profile),
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
        bmlBody.invisible = bmlBody.invisible;
        const usedKeyList = bodyStyle.getPropertyValue("--used-key-list");
        this.bmlEventTarget.dispatchEvent(new CustomEvent("usedkeylistchanged", {
            detail: {
                usedKeyList: new Set(usedKeyList.split(" ").filter((x) => {
                    return x === "basic" || x === "numeric-tuning" || x === "data-button" || x === "special-1" || x === "special-2";
                }))
            }
        }));
        // フォーカスはonloadの前に当たるがonloadが実行されるまではイベントは実行されない
        // STD-B24 第二分冊(2/2) 第二編 付属1 5.1.3参照
        this.resources.diagnostics.setPhase(token, "running", documentName, documentName);
        this.eventQueue.lockSyncEventQueue();
        let exit = false;
        let scriptCount = 0;
        try {
            if (this.resources.profile === resource_1.Profile.TrProfileC) {
                this.shimCProfileNavigation();
                this.focusFirstNavIndex();
            }
            else {
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
                }
                else if (x.textContent != null) {
                    scriptCount++;
                    if (exit = await this.interpreter.addScript(x.textContent, `${this.resources.activeDocument ?? ""}[${scriptCount}]`)) {
                        return true;
                    }
                }
            }
            const body = this.getBody();
            const onload = body?.getAttribute("arib-onload");
            if (onload != null) {
                this.logger.debug(`${this.logger.prefix}START ONLOAD`);
                this.eventDispatcher.setCurrentEvent({
                    target: body,
                    type: "load",
                });
                if (exit = await this.eventQueue.executeEventHandler(onload)) {
                    return true;
                }
                this.eventDispatcher.resetCurrentEvent();
                this.logger.debug(`${this.logger.prefix}END ONLOAD`);
            }
            for (const beitem of this.documentElement.querySelectorAll("beitem[subscribe=\"subscribe\"]")) {
                const bmlBeitem = DOM_1.BML.nodeToBMLNode(beitem, this.bmlDocument);
                bmlBeitem.subscribe = bmlBeitem.subscribe;
            }
        }
        finally {
            if (!exit) {
                this.eventQueue.unlockSyncEventQueue();
            }
        }
        this.logger.debug(`${this.logger.prefix}START PROC EVQ`);
        if (await this.eventQueue.processEventQueue()) {
            return true;
        }
        this.logger.debug(`${this.logger.prefix}END PROC EVQ`);
        if (this.tunnelPointerToVideoPlaneEnabled) {
            this.tunnelPointerToVideoPlane();
        }
        this.indicator?.setUrl(this.resources.activeDocument.replace(/(^https?:\/\/)[^/]+/, (_, g) => g + "…"), false);
        // P1: ここまで来たら描画とスクリプトは終わっている。以降ページが止まっているなら
        // 原因は読み込みではなく、待っているもの (ロック/表/イベント) の側にある
        this.resources.diagnostics.setPhase(token, "ready", documentName, documentName);
        return false;
    }
    processTimerEvent() {
        const timerFired = this.documentElement.querySelectorAll("beitem[type=\"TimerFired\"]");
        timerFired.forEach(elem => {
            const beitem = DOM_1.BML.nodeToBMLNode(elem, this.bmlDocument);
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
                const year = Number.parseInt(timeValue.substring(0, 4));
                const month = Number.parseInt(timeValue.substring(4, 6));
                const day = Number.parseInt(timeValue.substring(6, 8));
                const hour = Number.parseInt(timeValue.substring(8, 10));
                const minute = Number.parseInt(timeValue.substring(10, 12));
                const second = Number.parseInt(timeValue.substring(12, 14));
                // C16: the page's absolute time is in the broadcast local time, which the stream
                // declares in its TOT (PH +8, Japan +9); assuming JST put every PH timer an hour off.
                const jstTime = (0, time_offset_1.broadcastWallClockToUnixMillis)(year, month, day, hour, minute, second, this.resources.localTimeOffsetMinutes);
                if (this.resources.currentTimeUnixMillis != null && jstTime <= this.resources.currentTimeUnixMillis) {
                    beitem.internalTimerFired = true;
                    this.eventDispatcher.dispatchTimerFiredEvent(0, elem);
                }
            }
            else if (beitem.timeMode === "NPT") {
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
    launchDocument(documentName, options) {
        this.launchDocumentAsync(documentName, options);
        return NaN;
    }
    async launchStartup() {
        const module = `arib-dc://-1.-1.-1/${this.resources.startupComponentId.toString(16).padStart(2, "0")}/${this.resources.startupModuleId.toString(16).padStart(4, "0")}`;
        await this.resources.fetchResourceAsync(module);
        if (this.resources.fetchLockedResource(module + "/startup.bml")) {
            await this.launchDocumentAsync(module + "/startup.bml");
            return true;
        }
        else if (this.resources.fetchLockedResource(module)) {
            await this.launchDocumentAsync(module);
            return true;
        }
        else {
            this.exitDocument();
        }
        return false;
    }
    async launchDocumentAsync(documentName, options) {
        const withLink = options?.withLink ?? false;
        this.logger.log(`${this.logger.prefix}%claunchDocument`, "font-size: 1.5em", documentName);
        // P1: この起動の世代。入れ子の遷移が起きたら、外側の遅れて届いた書き込みは捨てる
        const token = ++this.launchToken;
        this.eventQueue.discard();
        const { component, module, filename } = this.resources.parseURL(documentName);
        const componentId = Number.parseInt(component ?? "", 16);
        const moduleId = Number.parseInt(module ?? "", 16);
        let normalizedDocument;
        if (!Number.isInteger(componentId) || !Number.isInteger(moduleId)) {
            const isInternet = documentName.startsWith("http://") || documentName.startsWith("https://");
            if (isInternet && (!this.resources.isInternetContent || (this.resources.profile === resource_1.Profile.TrProfileC && withLink))) {
                // 放送コンテンツ->通信コンテンツへの遷移
                this.resources.setBaseURIDirectory(documentName);
                normalizedDocument = documentName;
            }
            else if (this.resources.activeDocument != null && this.resources.isInternetContent) {
                // 通信コンテンツ->通信コンテンツへの遷移
                if (!this.resources.checkBaseURIDirectory(documentName)) {
                    // A 5.14.7 通信コンテンツのスコープのマッピング リンク状態特有の通信コンテンツの制約 ※2
                    // > 受信機が非リンクを搭載していない場合、再選局相当の動作を行なう、または、遷移を行わずにリンク状態を継続する
                    // C 8.3.11.4 受信機の動作失敗時のガイドライン
                    // > ベースURIディレクトリに合致しないURIが指定された場合は、データ放送ブラウザは失敗動作とし、受信機はエラーメッセージを表示する
                    this.logger.error(`${this.logger.prefix}base URI directory violation`);
                    this.resources.diagnostics.setPhase(token, "failed", this.resources.activeDocument, documentName, "base URI directory violation (E402)");
                    await this.fail("エラー", "ベースURIディレクトリエラー", "E402");
                    return NaN;
                }
                normalizedDocument = new URL(documentName, this.resources.activeDocument).toString();
            }
            else {
                this.logger.error(`${this.logger.prefix}failed to fetch document`, documentName);
                this.resources.diagnostics.setPhase(token, "failed", this.resources.activeDocument, documentName, "not a carousel path, and internet content is not allowed here");
                await this.quitDocument();
                return NaN;
            }
            this.resources.invalidateRemoteCache(documentName);
        }
        else if (filename != null) {
            normalizedDocument = `/${componentId.toString(16).padStart(2, "0")}/${moduleId.toString(16).padStart(4, "0")}/${filename}`;
        }
        else {
            normalizedDocument = `/${componentId.toString(16).padStart(2, "0")}/${moduleId.toString(16).padStart(4, "0")}`;
        }
        this.indicator?.setUrl(normalizedDocument.replace(/(^https?:\/\/)[^/]+/, (_, g) => g + "…"), true);
        this.resources.diagnostics.setPhase(token, "fetching", this.resources.activeDocument, normalizedDocument);
        const res = await this.resources.fetchResourceAsync(documentName);
        if (res == null) {
            this.resources.diagnostics.setPhase(token, "failed", this.resources.activeDocument, normalizedDocument, "document not found");
            if (normalizedDocument.startsWith("http")) {
                this.fail("ネットワークエラー", "文書の取得に失敗しました", "E400");
            }
            this.logger.error(`${this.logger.prefix}NOT FOUND`);
            await this.quitDocument();
            return NaN;
        }
        const ad = this.resources.activeDocument;
        await this.loadDocument(res, normalizedDocument, token);
        this.logger.debug(`${this.logger.prefix}return `, ad, documentName);
        return NaN;
    }
    findNavIndex(navIndex) {
        return Array.from(this.documentElement.querySelectorAll("*")).find(elem => {
            return parseInt(window.getComputedStyle(elem).getPropertyValue("--nav-index")) == navIndex;
        });
    }
    keyProcessStatus;
    processKeyDown(k) {
        if (k === AribKeyCode.DataButton) {
            // データボタンの場合DataButtonPressedのみが発生する
            this.eventDispatcher.dispatchDataButtonPressedEvent();
            return;
        }
        if (this.keyProcessStatus != null) {
            return;
        }
        const keyProcessStatus = {
            keyCode: k,
            isAccessKey: false,
        };
        this.keyProcessStatus = keyProcessStatus;
        let focusElement = this.bmlDocument.currentFocus?.["node"];
        if (this.resources.profile === resource_1.Profile.TrProfileC) {
            if (k == AribKeyCode.Left || k == AribKeyCode.Right || k == AribKeyCode.Up || k == AribKeyCode.Down) {
                if (focusElement == null) {
                    this.focusFirstNavIndex();
                }
                else {
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
                }
                else if (k === AribKeyCode.Back) {
                    if (focusElement.value.length >= 1) {
                        focusElement.value = focusElement.value.substring(0, focusElement.value.length - 1);
                    }
                }
            }
        }
        const body = this.getBody();
        if (body == null) {
            return;
        }
        const computedStyle = window.getComputedStyle(body);
        const usedKeyList = computedStyle.getPropertyValue("--used-key-list").split(" ").filter(x => x.length);
        if (usedKeyList.length && usedKeyList[0] === "none") {
            return;
        }
        const keyGroup = (this.resources.profile === resource_1.Profile.TrProfileC ? keyCodeToKeyGroupCProfile : keyCodeToKeyGroup).get(k);
        if (keyGroup == null) {
            return;
        }
        if (usedKeyList.length === 0) {
            if (keyGroup !== "basic" && keyGroup !== "data-button") {
                return;
            }
        }
        else if (!usedKeyList.some(x => x === keyGroup)) {
            return;
        }
        focusElement = this.bmlDocument.currentFocus?.["node"];
        const target = focusElement;
        this.eventQueue.queueAsyncEvent(async () => {
            const onkeydown = target?.getAttribute("onkeydown");
            if (target != null && onkeydown) {
                this.eventDispatcher.setCurrentIntrinsicEvent({
                    keyCode: k,
                    type: "keydown",
                    target,
                });
                let exit = false;
                try {
                    this.eventQueue.lockSyncEventQueue();
                    if (exit = await this.eventQueue.executeEventHandler(onkeydown)) {
                        return true;
                    }
                }
                finally {
                    if (!exit) {
                        this.eventQueue.unlockSyncEventQueue();
                    }
                }
                this.eventDispatcher.resetCurrentEvent();
            }
            // STD-B24 第二分冊 (2/2) 第二編 付属1 5.4.2.3参照
            const accessKey = keyCodeToAccessKey.get(k);
            if (accessKey != null) {
                const elem = this.documentElement.querySelector(`[accesskey="${accessKey}"]`);
                if (elem != null && this.isFocusable(elem)) {
                    this.focusHelper(elem);
                    this.logger.warn(`${this.logger.prefix}accesskey is half implemented.`);
                    // [6] 疑似的にkeyup割り込み事象が発生 keyCode = アクセスキー
                    const onkeyup = elem.getAttribute("onkeyup");
                    if (onkeyup != null) {
                        this.eventDispatcher.setCurrentIntrinsicEvent({
                            keyCode: k,
                            type: "keyup",
                            target: elem,
                        });
                        let exit = false;
                        try {
                            this.eventQueue.lockSyncEventQueue();
                            if (exit = await this.eventQueue.executeEventHandler(onkeyup)) {
                                return true;
                            }
                        }
                        finally {
                            if (!exit) {
                                this.eventQueue.unlockSyncEventQueue();
                            }
                        }
                        this.eventDispatcher.resetCurrentEvent();
                    }
                    // [6] 疑似的にkeydown割り込み事象が発生 keyCode = 決定キー
                    const onkeydown = elem.getAttribute("onkeydown");
                    k = AribKeyCode.Enter;
                    if (onkeydown != null) {
                        this.eventDispatcher.setCurrentIntrinsicEvent({
                            keyCode: k,
                            type: "keydown",
                            target: elem,
                        });
                        let exit = false;
                        try {
                            this.eventQueue.lockSyncEventQueue();
                            if (exit = await this.eventQueue.executeEventHandler(onkeydown)) {
                                return true;
                            }
                        }
                        finally {
                            if (!exit) {
                                this.eventQueue.unlockSyncEventQueue();
                            }
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
                if (this.bmlDocument.currentFocus instanceof DOM_1.BML.BMLInputElement) {
                    const inputMode = focusElement.getAttribute("inputmode");
                    if (inputMode === "indirect") {
                        this.bmlDocument.currentFocus.internalLaunchInputApplication();
                    }
                    else if (this.resources.profile === resource_1.Profile.TrProfileC) {
                        this.bmlDocument.currentFocus.internalLaunchInputApplication();
                    }
                }
                if (currentFocus instanceof DOM_1.BML.BMLAnchorElement && currentFocus.href != "") {
                    if (!currentFocus.href.startsWith("#")) {
                        if (this.launchDocument(currentFocus.href)) {
                            return true;
                        }
                    }
                    else {
                        this.focusFragment(currentFocus.href);
                    }
                }
            }
            // [11] accessKeyの場合focusElementに対し決定キーのkeyupを発生させる必要がある
            return false;
        });
        this.eventQueue.processEventQueue();
    }
    focusNextNavIndex(k, focusElement) {
        let nextFocus = "";
        let nextFocusStyle = window.getComputedStyle(focusElement);
        while (true) {
            if (k == AribKeyCode.Left) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-left");
            }
            else if (k == AribKeyCode.Right) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-right");
            }
            else if (k == AribKeyCode.Up) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-up");
            }
            else if (k == AribKeyCode.Down) {
                nextFocus = nextFocusStyle.getPropertyValue("--nav-down");
            }
            const nextFocusIndex = parseInt(nextFocus);
            if (Number.isFinite(nextFocusIndex) && nextFocusIndex >= 0 && nextFocusIndex <= 32767) {
                const next = this.findNavIndex(nextFocusIndex);
                if (next != null) {
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
    focusFragment(fragment) {
        if (fragment.startsWith("#")) {
            fragment = fragment.substring(1);
        }
        const fragmentElement = this.bmlDocument.getElementById(fragment)?.["node"];
        if (fragmentElement == null) {
            return;
        }
        if (this.isFocusable(fragmentElement)) {
            this.focusHelper(fragmentElement);
        }
        else {
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
    processKeyUp(k) {
        if (k === AribKeyCode.DataButton) {
            return;
        }
        this.eventQueue.queueAsyncEvent(async () => {
            const keyProcessStatus = this.keyProcessStatus;
            if (keyProcessStatus?.keyCode !== k) {
                return false;
            }
            else {
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
            const body = this.getBody();
            if (body == null) {
                return false;
            }
            const computedStyle = window.getComputedStyle(body);
            const usedKeyList = computedStyle.getPropertyValue("--used-key-list").split(" ").filter(x => x.length);
            if (usedKeyList.length && usedKeyList[0] === "none") {
                return false;
            }
            const keyGroup = (this.resources.profile === resource_1.Profile.TrProfileC ? keyCodeToKeyGroupCProfile : keyCodeToKeyGroup).get(keyCode);
            if (keyGroup == null) {
                return false;
            }
            if (usedKeyList.length === 0) {
                if (keyGroup !== "basic" && keyGroup !== "data-button") {
                    return false;
                }
            }
            else if (!usedKeyList.some(x => x === keyGroup)) {
                return false;
            }
            const onkeyup = focusElement.getAttribute("onkeyup");
            if (onkeyup) {
                this.eventDispatcher.setCurrentIntrinsicEvent({
                    keyCode,
                    type: "keyup",
                    target: focusElement,
                });
                let exit = false;
                try {
                    this.eventQueue.lockSyncEventQueue();
                    if (exit = await this.eventQueue.executeEventHandler(onkeyup)) {
                        return true;
                    }
                }
                finally {
                    if (!exit) {
                        this.eventQueue.unlockSyncEventQueue();
                    }
                }
                this.eventDispatcher.resetCurrentEvent();
            }
            return false;
        });
        this.eventQueue.processEventQueue();
    }
    clutToDecls(table) {
        const ret = [];
        let i = 0;
        for (const t of table) {
            const decl = {
                type: "declaration",
                property: "--clut-color-" + i,
                value: `#${t[0].toString(16).padStart(2, "0")}${t[1].toString(16).padStart(2, "0")}${t[2].toString(16).padStart(2, "0")}${(t[3]).toString(16).padStart(2, "0")}`,
            };
            ret.push(decl);
            i++;
        }
        return ret;
    }
    async getCLUT(clutUrl) {
        const res = await this.resources.fetchResourceAsync(clutUrl);
        let clut = default_clut_1.defaultCLUT;
        if (res?.data) {
            clut = (0, clut_1.readCLUT)(res.data, this.logger);
        }
        return this.clutToDecls(clut);
    }
    async convertCSSUrl(url) {
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
            bt709 = await (0, arib_jpeg_1.convertJPEG)(bt601);
            res.blobUrl.set("BT.709", bt709);
            return bt709;
        }
        catch (e) {
            this.logger.error(`${this.logger.prefix}failed to decode image`, url, e);
            return undefined;
        }
    }
    loadObjects() {
        this.documentElement.querySelectorAll("object").forEach(obj => {
            const adata = obj.getAttribute("arib-data");
            DOM_1.BML.nodeToBMLNode(obj, this.bmlDocument).data = adata;
        });
        if (this.resources.profile === resource_1.Profile.TrProfileC) {
            this.documentElement.querySelectorAll("img").forEach(obj => {
                const asrc = obj.getAttribute("arib-src");
                if (!asrc) {
                    return;
                }
                DOM_1.BML.nodeToBMLNode(obj, this.bmlDocument).src = asrc;
            });
        }
    }
    pcrBase;
    getNPT90kHz() {
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
            }
            else if (this.npt.scaleDenominator === 1 && this.npt.scaleNumerator === 0) {
                return NPTr;
            }
            else {
                return null;
            }
        }
        else if ((STCc > STCr && STCr + STCmax - STCc <= Wpre) || (STCc < STCr && STCr - STCc <= Wpre)) {
            if (this.npt.scaleDenominator === 1 && this.npt.scaleNumerator === 1) {
                return NPTr;
            }
            else if (this.npt.scaleDenominator === 1 && this.npt.scaleNumerator === 0) {
                return (STCc + ((STCmax + NPTr - STCr) % STCmax)) % STCmax;
            }
            else {
                return null;
            }
        }
        return null;
    }
    onMessage(msg) {
        if (msg.type === "pcr") {
            this.pcrBase = msg.pcrBase;
            this.processTimerEvent();
        }
        else if (msg.type === "esEventUpdated") {
            const activeComponentId = this.resources.currentComponentId;
            if (activeComponentId == null) {
                return;
            }
            let queued = false;
            const nptReference = msg.events.find((x) => x.type === "nptReference");
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
                        this.logger.debug(`${this.logger.prefix}NPTReferred`, this.npt);
                    }
                    const nptReferred = this.documentElement.querySelectorAll("beitem[type=\"NPTReferred\"][subscribe=\"subscribe\"]");
                    for (const beitemNative of Array.from(nptReferred)) {
                        const beitem = DOM_1.BML.nodeToBMLNode(beitemNative, this.bmlDocument);
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
                                target: beitemNative,
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
                const beitem = DOM_1.BML.nodeToBMLNode(beitemNative, this.bmlDocument);
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
                    }
                    else if (event.type !== "immediateEvent") {
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
                        beitem.internalMessageVersion = new Map();
                    }
                    if (beitem.internalMessageVersion.get(eventMessageId) === eventMessageVersion) {
                        continue;
                    }
                    beitem.internalMessageVersion.set(eventMessageId, eventMessageVersion);
                    const privateData = this.decodeText(Uint8Array.from(event.privateDataByte));
                    this.logger.debug(`${this.logger.prefix}EventMessageFired`, eventMessageId, eventMessageVersion, privateData);
                    this.eventQueue.queueAsyncEvent(async () => {
                        this.eventDispatcher.setCurrentBeventEvent({
                            type: "EventMessageFired",
                            target: beitemNative,
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
    loadDRCS(glyphs) {
        this.bmlDocument.internalLoadDRCS(glyphs);
    }
    /**
     * P1: the page as the host can see it — what document is up, what phase it is in, and every
     * beitem subscription with the number of times its handler actually ran. A subscription that
     * has never fired is the single most common reason a page sits on 読み込み中, and before this
     * the host had no way to tell it apart from a page that simply looks like that.
     */
    inspect() {
        const diagnostics = this.resources.diagnostics;
        const events = diagnostics.describeEvents();
        const key = (ref) => {
            if (ref == null || ref.length === 0) {
                return null;
            }
            const { componentId, moduleId } = this.resources.parseURLEx(ref);
            return componentId != null && moduleId != null
                ? `${componentId.toString(16)}/${moduleId.toString(16)}`
                : ref.toLowerCase();
        };
        const beitems = [];
        for (const node of Array.from(this.documentElement.querySelectorAll("beitem"))) {
            const elem = node;
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
            profile: String(this.resources.profile ?? ""),
            bodyLoading: body?.hasAttribute("arib-loading") ?? false,
            startupDelivered: this.loaded,
            invisible: this.invisible,
            elements: this.documentElement.querySelectorAll("*").length,
            beitems,
        };
    }
    addDRCSFont(font) {
        this.fonts.push(font);
        document.fonts.add(font);
    }
    get invisible() {
        const body = this.getBody();
        if (body == null) {
            return undefined;
        }
        return DOM_1.BML.nodeToBMLNode(body, this.bmlDocument).invisible;
    }
    defaultShowErrorMessage(title, message, code) {
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
        }
        else {
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
exports.Content = Content;
//# sourceMappingURL=content.js.map