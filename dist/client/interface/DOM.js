"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BML = void 0;
const media_type_1 = require("../media_type");
const BMLCSS2Properties_1 = require("./BMLCSS2Properties");
const resource_1 = require("../resource");
const arib_png_1 = require("../arib_png");
const clut_1 = require("../clut");
const default_clut_1 = require("../default_clut");
const transpile_css_1 = require("../transpile_css");
const bml_browser_1 = require("../bml_browser");
const arib_jpeg_1 = require("../arib_jpeg");
const arib_mng_1 = require("../arib_mng");
const arib_aiff_1 = require("../arib_aiff");
const unicode_to_jis_map_1 = require("../unicode_to_jis_map");
const text_1 = require("../text");
const jis_to_unicode_map_1 = require("../jis_to_unicode_map");
var BML;
(function (BML) {
    function nodeToBMLNode(node, ownerDocument) {
        return node == null ? null : wrapNodeNonNull(node, ownerDocument);
    }
    BML.nodeToBMLNode = nodeToBMLNode;
    function bmlNodeToNode(node) {
        return node == null ? null : node["node"];
    }
    BML.bmlNodeToNode = bmlNodeToNode;
    function htmlElementToBMLHTMLElement(node, ownerDocument) {
        if (node == null) {
            return null;
        }
        const result = wrapNodeNonNull(node, ownerDocument);
        if (!(result instanceof HTMLElement)) {
            throw new TypeError("failed to cast to BML.HTMLElement");
        }
        return result;
    }
    BML.htmlElementToBMLHTMLElement = htmlElementToBMLHTMLElement;
    function wrapNode(node, ownerDocument) {
        return node == null ? null : wrapNodeNonNull(node, ownerDocument);
    }
    function wrapNodeNonNull(node, ownerDocument) {
        const bmlNode = ownerDocument.internalBMLNodeInstanceMap.get(node);
        if (bmlNode != null) {
            return bmlNode;
        }
        const klass = getNodeClass(node, ownerDocument.logger);
        const inst = new klass(node, ownerDocument);
        ownerDocument.internalBMLNodeInstanceMap.set(node, inst);
        return inst;
    }
    function getNodeClass(node, logger) {
        if (node instanceof globalThis.HTMLInputElement) {
            return BMLInputElement;
        }
        else if (node instanceof globalThis.HTMLBRElement) {
            return BMLBRElement;
        }
        else if (node instanceof globalThis.HTMLAnchorElement) {
            return BMLAnchorElement;
        }
        else if (node instanceof globalThis.HTMLHtmlElement) {
            return BMLBmlElement;
        }
        else if (node instanceof globalThis.HTMLScriptElement) {
            return HTMLScriptElement;
        }
        else if (node instanceof globalThis.HTMLObjectElement) {
            return BMLObjectElement;
        }
        else if (node instanceof globalThis.HTMLImageElement) {
            // Cプロファイル
            return BMLImageElement;
        }
        else if (node instanceof globalThis.HTMLHeadElement) {
            return HTMLHeadElement;
        }
        else if (node instanceof globalThis.HTMLTitleElement) {
            return HTMLTitleElement;
        }
        else if (node instanceof globalThis.HTMLSpanElement) {
            return BMLSpanElement;
        }
        else if (node instanceof globalThis.HTMLMetaElement) {
            return HTMLMetaElement;
        }
        else if (node instanceof globalThis.HTMLStyleElement) {
            return HTMLStyleElement;
        }
        else if (node instanceof globalThis.HTMLElement && node.nodeName.toLowerCase() === "bevent") {
            return BMLBeventElement;
        }
        else if (node instanceof globalThis.HTMLElement && node.nodeName.toLowerCase() === "beitem") {
            return BMLBeitemElement;
        }
        else if (node instanceof globalThis.HTMLElement && node.nodeName.toLowerCase() === "arib-cdata") {
            return CDATASection;
        }
        else if (node instanceof globalThis.HTMLElement && node.nodeName.toLowerCase() === "arib-text") {
            return Text;
        }
        else if (node instanceof globalThis.HTMLBodyElement) {
            return BMLBodyElement;
        }
        else if (node instanceof globalThis.HTMLParagraphElement) {
            return BMLParagraphElement;
        }
        else if (node instanceof globalThis.HTMLDivElement) {
            return BMLDivElement;
        }
        else if (node instanceof globalThis.HTMLHtmlElement) {
            return BMLBmlElement;
        }
        else if (node instanceof globalThis.HTMLTextAreaElement) {
            return BMLTextAreaElement;
        }
        else if (node instanceof globalThis.HTMLFormElement) {
            return BMLFormElement;
        }
        else if (node instanceof globalThis.HTMLPreElement) {
            return BMLPreElement;
        }
        else if (node instanceof globalThis.HTMLLinkElement) {
            return HTMLLinkElement;
        }
        else if (node instanceof globalThis.HTMLElement) {
            logger.error(`${logger.prefix}unsupported node`, node);
            return HTMLElement;
        }
        else if (node instanceof globalThis.Element) {
            return Element;
        }
        else if (node instanceof globalThis.CDATASection) {
            return CDATASection;
        }
        else if (node instanceof globalThis.Text) {
            return Text;
            // CharcterDataは誤植
        }
        else if (node instanceof globalThis.CharacterData) {
            return CharacterData;
        }
        else if (node instanceof globalThis.Node) {
            logger.error(`${logger.prefix}unsupported node`, node);
            return Node;
        }
        return Node;
    }
    function isFocusable(elem) {
        if (elem instanceof globalThis.HTMLInputElement) {
            if (elem.disabled) {
                return false;
            }
        }
        const style = window.getComputedStyle(elem);
        if (style.visibility === "hidden") {
            return false;
        }
        return true;
    }
    BML.isFocusable = isFocusable;
    function focus(node, ownerDocument) {
        const prevFocus = ownerDocument.currentFocus;
        if (prevFocus === node) {
            return;
        }
        if (!isFocusable(node["node"])) {
            return;
        }
        if (prevFocus != null) {
            blur(prevFocus, ownerDocument, node);
        }
        else {
            ownerDocument._currentFocus = node;
        }
        node.internalSetFocus(true);
        ownerDocument.eventQueue.queueSyncEvent({ type: "focus", target: node["node"] });
    }
    function blur(node, ownerDocument, newFocus) {
        if (ownerDocument.currentFocus !== node) {
            return;
        }
        node.internalSetActive(false);
        node.internalSetFocus(false);
        if (node instanceof HTMLInputElement) {
            // changeイベントはblurイベントに先立って実行される
            ownerDocument.inputApplication?.cancel("blur");
        }
        ownerDocument._currentFocus = newFocus ?? null;
        ownerDocument.eventQueue.queueSyncEvent({ type: "blur", target: node["node"] });
    }
    // impl
    class Node {
        node;
        ownerDocument;
        constructor(node, ownerDocument) {
            this.node = node;
            this.ownerDocument = ownerDocument;
        }
        get parentNode() {
            return wrapNode(this.node.parentNode, this.ownerDocument);
        }
        get firstChild() {
            let firstChild = this.node.firstChild;
            if (firstChild != null && firstChild.nodeName.toLowerCase() === "arib-bg") {
                firstChild = firstChild.nextSibling;
            }
            return wrapNode(firstChild, this.ownerDocument);
        }
        get lastChild() {
            let lastChild = this.node.lastChild;
            if (lastChild != null && lastChild.nodeName.toLowerCase() === "arib-bg") {
                lastChild = null;
            }
            return wrapNode(lastChild, this.ownerDocument);
        }
        get previousSibling() {
            let previousSibling = this.node.previousSibling;
            if (previousSibling != null && previousSibling.nodeName.toLowerCase() === "arib-bg") {
                previousSibling = null;
            }
            return wrapNode(previousSibling, this.ownerDocument);
        }
        get nextSibling() {
            return wrapNode(this.node.nextSibling, this.ownerDocument);
        }
    }
    BML.Node = Node;
    function hasDRCS(text) {
        return /[\uec00-\uecbb]/.test(text);
    }
    function renderDRCS(drcs, colors) {
        const canvas = document.createElement("canvas");
        canvas.width = drcs.width;
        canvas.height = drcs.height;
        const context = canvas.getContext("2d");
        for (let y = 0; y < drcs.height; y++) {
            for (let x = 0; x < drcs.width; x++) {
                const bit = drcs.bitmap[y * drcs.width + x];
                if (bit) {
                    context.fillStyle = colors[bit - 1];
                    context.fillRect(x, y, 1, 1);
                }
            }
        }
        return canvas;
    }
    // impl
    class CharacterData extends Node {
        node;
        flowData;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            if (node.parentElement != null) {
                node.parentElement.style.fontSize = "var(--font-size)";
                node.parentElement.style.lineHeight = "var(--line-height)";
            }
            const computedStyle = window.getComputedStyle(this.getParentBlock(node));
            const display = computedStyle.getPropertyValue("--display").trim();
            const drcs = hasDRCS(node.textContent ?? "");
            this.node = node;
            if (drcs || display === "-wap-marquee" || (computedStyle.letterSpacing !== "normal" && computedStyle.letterSpacing !== "0px")) {
                this.internalAddFlowData(drcs);
            }
        }
        internalAddFlowData(drcs) {
            let textNode;
            if (this.node instanceof globalThis.CDATASection) {
                textNode = document.createElement("arib-cdata");
            }
            else {
                textNode = document.createElement("arib-text");
            }
            const textData = this.node.textContent ?? "";
            this.node.replaceWith(textNode);
            const root = textNode.attachShadow({ mode: "closed" });
            const parentBlock = this.getParentBlock(textNode);
            this.flowData = { textNode, parentBlock, root, drcs, textData };
            this.ownerDocument.internalBMLNodeInstanceMap.set(textNode, this);
            this.ownerDocument.internalBMLNodeInstanceMap.delete(this.node);
        }
        getParentBlock(node) {
            let parent = node.parentElement;
            while (parent != null) {
                if (window.getComputedStyle(parent).display !== "inline") {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        }
        createMarquee(computedStyle) {
            const style = computedStyle.getPropertyValue("---wap-marquee-style").trim().toLowerCase();
            // 初期値: 1 最大値: 16
            // infinite
            const loop = Number.parseInt(computedStyle.getPropertyValue("---wap-marquee-loop").trim().toLowerCase());
            if (loop === 0 || computedStyle.visibility === "hidden") {
                // > また、0が設定された場合は、指定回marquee動作を行なった後と同様に表示されるだけである。
                // TR-B14
                // > If the value is "0", no looping occurs and the element is displayed as if it had finished looping a specified number of times.
                // WAP
                const span = document.createElement("span");
                if (style !== "slide") {
                    span.style.visibility = "hidden";
                }
                return span;
            }
            const marquee = document.createElement("marquee");
            marquee.behavior = style;
            if (Number.isFinite(loop)) {
                marquee.loop = loop;
            }
            // dirはrtl固定
            const speed = computedStyle.getPropertyValue("---wap-marquee-speed").trim().toLowerCase();
            switch (speed) {
                case "slow":
                    marquee.scrollAmount = 3;
                    break;
                case "normal":
                    marquee.scrollAmount = 6;
                    break;
                case "fast":
                    marquee.scrollAmount = 12;
                    break;
            }
            return marquee;
        }
        flowText(text) {
            const flowData = this.flowData;
            if (flowData == null) {
                return;
            }
            flowData.textData = text;
            const nextElement = flowData.textNode.nextElementSibling;
            const computedStyle = window.getComputedStyle(flowData.textNode);
            if (flowData.textNode.nodeName.toLowerCase() === "arib-text") {
                text = text.replace(/[ \n\r\t]+/g, " ");
            }
            const display = computedStyle.getPropertyValue("--display").trim();
            // Cプロファイル
            const wapMarquee = display === "-wap-marquee";
            let fontSize = Number.parseInt(computedStyle.fontSize);
            if (Number.isNaN(fontSize)) {
                fontSize = 16;
            }
            if (computedStyle.letterSpacing === "normal" || computedStyle.letterSpacing === "0px") {
                if (hasDRCS(text)) {
                    // Cプロファイルでは外字は使われないためwapMarqueeは考慮しない
                    flowData.textNodeInRoot = undefined;
                    const children = [];
                    let prev = 0;
                    for (const match of text.matchAll(/[\uec00-\uecbb]/g)) {
                        const prevText = text.substring(prev, match.index);
                        if (prevText !== "") {
                            const char = document.createElement("span");
                            char.textContent = prevText;
                            children.push(char);
                        }
                        const char = document.createElement("span");
                        char.textContent = match[0];
                        const drcs = this.ownerDocument.internalGetDRCS(computedStyle.fontFamily, fontSize, match[0]);
                        if (drcs != null) {
                            let [gray2, gray1] = computedStyle.getPropertyValue("--grayscale-color-index").split(" ").map(v => parseInt(v));
                            if (!Number.isSafeInteger(gray1) || gray1 < 0 || gray1 > 255) {
                                gray1 = 8;
                            }
                            if (!Number.isSafeInteger(gray2) || gray2 < 0 || gray2 > 255) {
                                gray2 = 8;
                            }
                            const colors = [computedStyle.getPropertyValue("--clut-color-" + gray1), computedStyle.getPropertyValue("--clut-color-" + gray2), computedStyle.color];
                            const canvas = renderDRCS(drcs, colors);
                            char.style.backgroundImage = `url('${canvas.toDataURL()}')`;
                            char.style.backgroundRepeat = "no-repeat";
                            char.style.color = "transparent";
                            char.style.display = "inline-block";
                            char.style.verticalAlign = "text-bottom";
                            char.style.width = `${drcs.width}px`;
                            char.style.height = `${drcs.height}px`;
                        }
                        children.push(char);
                        prev = match.index + match[0].length;
                    }
                    const prevText = text.substring(prev);
                    if (prevText !== "") {
                        const char = document.createElement("span");
                        char.textContent = prevText;
                        children.push(char);
                    }
                    flowData.root.replaceChildren(...children);
                    return;
                }
                else if (flowData.textNodeInRoot == null) {
                    // shadow DOMの中なので外の* {}のようなCSSは適用されない一方プロパティは継承される
                    flowData.textNodeInRoot = document.createTextNode(text);
                    if (wapMarquee) {
                        flowData.marquee = this.createMarquee(computedStyle);
                        flowData.marquee.replaceChildren(flowData.textNodeInRoot);
                        flowData.root.replaceChildren(flowData.marquee);
                    }
                    else {
                        flowData.root.replaceChildren(flowData.textNodeInRoot);
                    }
                }
                else if (wapMarquee) {
                    flowData.marquee = this.createMarquee(computedStyle);
                    flowData.marquee.replaceChildren(flowData.textNodeInRoot);
                    flowData.root.replaceChildren(flowData.marquee);
                    flowData.textNodeInRoot.data = text;
                }
                else {
                    flowData.textNodeInRoot.data = text;
                }
                return;
            }
            flowData.textNodeInRoot = undefined;
            const left = flowData.textNode.clientLeft;
            const top = flowData.textNode.clientTop;
            const parent = flowData.parentBlock;
            const width = parent.clientWidth;
            let letterSpacing = Number.parseInt(computedStyle.letterSpacing);
            if (Number.isNaN(letterSpacing)) {
                letterSpacing = 0;
            }
            let lineHeight = Number.parseInt(computedStyle.lineHeight);
            if (Number.isNaN(lineHeight)) {
                lineHeight = fontSize * 1;
            }
            let x = left;
            let y = top;
            const children = [];
            for (let i = 0; i < text.length; i++) {
                const c = text.charAt(i);
                const isLast = nextElement == null && i === text.length - 1;
                if (c === "\r") {
                    continue;
                }
                if (c === "\n") {
                    const char = document.createTextNode("\n");
                    children.push(char);
                    x = 0;
                    y += lineHeight;
                    continue;
                }
                const jis = unicode_to_jis_map_1.unicodeToJISMap[c.charCodeAt(0)];
                const char = document.createElement("span");
                char.textContent = c;
                char.style.display = "inline-block";
                char.style.textAlign = "center";
                const fontWidth = jis ? fontSize : fontSize / 2;
                if (jis >= 0x7721 && jis <= 0x787e) {
                    const drcs = this.ownerDocument.internalGetDRCS(computedStyle.fontFamily, fontSize, c);
                    if (drcs != null) {
                        let [gray2, gray1] = computedStyle.getPropertyValue("--grayscale-color-index").split(" ").map(v => parseInt(v));
                        if (!Number.isSafeInteger(gray1) || gray1 < 0 || gray1 > 255) {
                            gray1 = 8;
                        }
                        if (!Number.isSafeInteger(gray2) || gray2 < 0 || gray2 > 255) {
                            gray2 = 8;
                        }
                        const colors = [computedStyle.getPropertyValue("--clut-color-" + gray1), computedStyle.getPropertyValue("--clut-color-" + gray2), computedStyle.color];
                        const canvas = renderDRCS(drcs, colors);
                        char.style.backgroundImage = `url('${canvas.toDataURL()}')`;
                        char.style.backgroundRepeat = "no-repeat";
                        char.style.color = "transparent";
                        char.style.verticalAlign = "text-bottom";
                    }
                }
                char.style.width = `${fontWidth}px`;
                char.style.lineHeight = `${lineHeight}px`;
                if (x + fontWidth > width) {
                    x = 0;
                    y += lineHeight;
                }
                // レタースペーシングは折り返し前と最後には付かない (STD-B24 第二分冊 (2/2) 第二編 付属１ 6.3.2参照)
                if (!isLast && x + fontWidth + letterSpacing <= width) {
                    char.style.marginRight = `${letterSpacing}px`;
                    x += letterSpacing;
                }
                children.push(char);
                x += fontWidth;
            }
            if (wapMarquee) {
                flowData.marquee = this.createMarquee(computedStyle);
                // Firefoxだとmarqueeのなかに要素を追加する前にrootに追加してしまうとスクロールがおかしくなる
                flowData.marquee.replaceChildren(...children);
                flowData.root.replaceChildren(flowData.marquee);
            }
            else {
                flowData.root.replaceChildren(...children);
            }
        }
        internalReflow() {
            if (this.flowData == null) {
                return false;
            }
            this.flowText(this.data);
            return !this.flowData.drcs;
        }
        get data() {
            if (this.flowData == null) {
                return this.node.data;
            }
            return this.flowData.textData;
        }
        set data(value) {
            value = String(value);
            if (this.flowData != null) {
                this.flowData.textData = value;
                if (this.flowData.textNodeInRoot != null && !hasDRCS(value)) {
                    if (this.flowData.textNode.nodeName.toLowerCase() === "arib-text") {
                        this.flowData.textNodeInRoot.data = value.replace(/[ \n\r\t]+/g, " ");
                    }
                    else {
                        this.flowData.textNodeInRoot.data = value;
                    }
                }
                else {
                    this.flowText(value);
                }
                return;
            }
            else if (hasDRCS(value)) {
                this.internalAddFlowData(true);
                this.flowText(value);
                return;
            }
            this.node.data = value;
        }
        get length() {
            return this.data.length;
        }
    }
    BML.CharacterData = CharacterData;
    // impl
    class Text extends CharacterData {
    }
    BML.Text = Text;
    // impl
    class CDATASection extends Text {
    }
    BML.CDATASection = CDATASection;
    // impl
    class Document extends Node {
        node;
        _implementation;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
            this._implementation = new DOMImplementation();
        }
        get implementation() {
            return this._implementation;
        }
        get documentElement() {
            return wrapNodeNonNull(this.node.documentElement, this.ownerDocument);
        }
    }
    BML.Document = Document;
    // impl
    class HTMLDocument extends Document {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        getElementById(id) {
            const stringId = String(id);
            if (stringId === "") {
                return null;
            }
            return wrapNode(this.node.querySelector("#" + CSS.escape(stringId)), this.ownerDocument);
        }
    }
    BML.HTMLDocument = HTMLDocument;
    // impl
    class BMLDocument extends HTMLDocument {
        internalBMLNodeInstanceMap = new WeakMap();
        _currentFocus = null;
        _currentEvent = null;
        interpreter;
        eventQueue;
        resources;
        browserEventTarget;
        audioNodeProvider;
        inputApplication;
        setMainAudioStreamCallback;
        logger;
        constructor(node, interpreter, eventQueue, resources, browserEventTarget, audioNodeProvider, inputApplication, setMainAudioStreamCallback, logger) {
            super(node, null); // !
            this.ownerDocument = this; // !!
            this.interpreter = interpreter;
            this.eventQueue = eventQueue;
            this.resources = resources;
            this.browserEventTarget = browserEventTarget;
            this.audioNodeProvider = audioNodeProvider;
            this.inputApplication = inputApplication;
            this.setMainAudioStreamCallback = setMainAudioStreamCallback;
            this.logger = logger;
        }
        _drcsGlyphs = new Map();
        internalGetDRCS(fontFamily, fontSize, char) {
            let fontId = 1;
            switch (fontFamily) {
                case "丸ゴシック":
                    fontId = 1;
                    break;
                case "角ゴシック":
                    fontId = 2;
                    break;
                case "太丸ゴシック":
                    fontId = 3;
                    break;
            }
            const key = `${char}-${fontSize}-${fontSize}-${fontId}`;
            return this._drcsGlyphs.get(key);
        }
        internalLoadDRCS(glyphs) {
            for (const glyph of glyphs) {
                for (const g of glyph.glyphs) {
                    const c = jis_to_unicode_map_1.jisToUnicodeMap[(glyph.ku - 1) * 94 + glyph.ten - 1];
                    if (typeof c !== "number") {
                        continue;
                    }
                    const key = `${String.fromCharCode(c)}-${g.width}-${g.height}-${g.fontId}`;
                    this._drcsGlyphs.set(key, g);
                }
            }
            for (const node of this.node.querySelectorAll("arib-text, arib-cdata")) {
                const cd = nodeToBMLNode(node, this.ownerDocument);
                if (hasDRCS(cd.data)) {
                    cd.internalReflow();
                }
            }
        }
        internalUnloadAllDRCS() {
            this._drcsGlyphs.clear();
        }
        get documentElement() {
            return wrapNodeNonNull(this.node, this.ownerDocument);
        }
        get currentFocus() {
            return this._currentFocus;
        }
        get currentEvent() {
            return this._currentEvent;
        }
    }
    BML.BMLDocument = BMLDocument;
    // impl
    class Element extends Node {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get tagName() {
            const tagName = this.node.tagName.toLowerCase();
            if (tagName.startsWith("arib-")) {
                return tagName.substring("arib-".length);
            }
            return tagName;
        }
    }
    BML.Element = Element;
    // impl
    class HTMLElement extends Element {
        node;
        normalStyleMap;
        focusStyleMap;
        activeStyleMap;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
            this.normalStyleMap = new Map();
            this.focusStyleMap = new Map();
            this.activeStyleMap = new Map();
            for (const style of this.node.style) {
                this.normalStyleMap.set(style, this.node.style.getPropertyValue(style));
            }
        }
        get id() {
            return this.node.id;
        }
        get className() {
            return this.node.className;
        }
        internalSetFocus(focus) {
            if (focus === (this.node.getAttribute("web-bml-state") === "focus")) {
                return;
            }
            if (focus) {
                this.node.setAttribute("web-bml-state", "focus");
            }
            else {
                this.node.removeAttribute("web-bml-state");
            }
            this.applyStyle();
        }
        internalSetActive(active) {
            if (active === (this.node.getAttribute("web-bml-state") === "active")) {
                return;
            }
            if (active) {
                this.node.setAttribute("web-bml-state", "active");
            }
            else {
                this.node.removeAttribute("web-bml-state");
            }
            this.applyStyle();
        }
        applyStyle() {
            if (this.focusStyleMap.size === 0 && this.activeStyleMap.size === 0) {
                return;
            }
            const state = this.node.getAttribute("web-bml-state");
            this.node.style.cssText = "";
            for (const [style, value] of this.normalStyleMap) {
                this.node.style.setProperty(style, value);
            }
            if (state === "focus") {
                for (const [style, value] of this.focusStyleMap) {
                    this.node.style.setProperty(style, value);
                }
            }
            else if (state === "active") {
                for (const [style, value] of this.activeStyleMap) {
                    this.node.style.setProperty(style, value);
                }
            }
        }
        applyDRCSStyle(property) {
            switch (property) {
                case "--grayscale-color-index":
                case "--color-index":
                case "--color":
                case "--font-size":
                case "font-family":
                    for (const node of this.node.querySelectorAll("arib-text, arib-cdata")) {
                        const cd = nodeToBMLNode(node, this.ownerDocument);
                        if (hasDRCS(cd.data)) {
                            cd.internalReflow();
                        }
                    }
                    break;
            }
        }
        getNormalStyle() {
            const normalComputedPropertyGetter = (property) => {
                const savedState = this.node.getAttribute("web-bml-state");
                if (savedState === "active") {
                    this.internalSetActive(false);
                }
                else if (savedState === "focus") {
                    this.internalSetFocus(false);
                }
                const value = window.getComputedStyle(this.node).getPropertyValue(property);
                if (savedState === "active") {
                    this.internalSetActive(true);
                }
                else if (savedState === "focus") {
                    this.internalSetFocus(true);
                }
                return value;
            };
            const normalPropertySetter = (property, value) => {
                const currentState = this.node.getAttribute("web-bml-state");
                if (currentState === "focus") {
                    if (!this.focusStyleMap.has(property)) {
                        this.node.style.setProperty(property, value);
                    }
                }
                else if (currentState === "active") {
                    if (!this.activeStyleMap.has(property)) {
                        this.node.style.setProperty(property, value);
                    }
                }
                else {
                    this.node.style.setProperty(property, value);
                }
                this.applyDRCSStyle(property);
            };
            const declaration = new BMLCSS2Properties_1.BMLCSSStyleDeclaration(this.normalStyleMap, this.normalStyleMap, normalComputedPropertyGetter, normalPropertySetter);
            return new BML.BMLCSS2Properties(declaration, this.node, this.ownerDocument.browserEventTarget);
        }
        getFocusStyle() {
            const focusComputedPropertyGetter = (property) => {
                const savedState = this.node.getAttribute("web-bml-state");
                this.internalSetFocus(true);
                const value = window.getComputedStyle(this.node).getPropertyValue(property);
                if (savedState === "active") {
                    this.internalSetActive(true);
                }
                else {
                    this.internalSetFocus(savedState === "focus");
                }
                return value;
            };
            const focusPropertySetter = (property, value) => {
                const currentState = this.node.getAttribute("web-bml-state");
                if (currentState === "focus") {
                    this.node.style.setProperty(property, value);
                    this.applyDRCSStyle(property);
                }
            };
            const declaration = new BMLCSS2Properties_1.BMLCSSStyleDeclaration(this.normalStyleMap, this.focusStyleMap, focusComputedPropertyGetter, focusPropertySetter);
            return new BML.BMLCSS2Properties(declaration, this.node, this.ownerDocument.browserEventTarget);
        }
        getActiveStyle() {
            const activeComputedPropertyGetter = (property) => {
                const savedState = this.node.getAttribute("web-bml-state");
                this.internalSetActive(true);
                const value = window.getComputedStyle(this.node).getPropertyValue(property);
                if (savedState === "focus") {
                    this.internalSetFocus(true);
                }
                else {
                    this.internalSetActive(savedState === "active");
                }
                return value;
            };
            const activePropertySetter = (property, value) => {
                const currentState = this.node.getAttribute("web-bml-state");
                if (currentState === "active") {
                    this.node.style.setProperty(property, value);
                    this.applyDRCSStyle(property);
                }
            };
            const declaration = new BMLCSS2Properties_1.BMLCSSStyleDeclaration(this.normalStyleMap, this.activeStyleMap, activeComputedPropertyGetter, activePropertySetter);
            return new BML.BMLCSS2Properties(declaration, this.node, this.ownerDocument.browserEventTarget);
        }
    }
    BML.HTMLElement = HTMLElement;
    // impl
    class HTMLBRElement extends HTMLElement {
    }
    BML.HTMLBRElement = HTMLBRElement;
    // impl
    class BMLBRElement extends HTMLBRElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
    }
    BML.BMLBRElement = BMLBRElement;
    // impl
    class HTMLHtmlElement extends HTMLElement {
    }
    BML.HTMLHtmlElement = HTMLHtmlElement;
    // impl
    class BMLBmlElement extends HTMLHtmlElement {
    }
    BML.BMLBmlElement = BMLBmlElement;
    // impl
    class HTMLAnchorElement extends HTMLElement {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get accessKey() {
            return this.node.accessKey;
        }
        get href() {
            return this.node.getAttribute("bml-href") ?? "";
        }
        set href(value) {
            this.node.setAttribute("bml-href", value);
        }
        blur() {
            blur(this, this.ownerDocument);
        }
        focus() {
            focus(this, this.ownerDocument);
        }
    }
    BML.HTMLAnchorElement = HTMLAnchorElement;
    // impl
    class BMLAnchorElement extends HTMLAnchorElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
        get focusStyle() {
            return this.getFocusStyle();
        }
        get activeStyle() {
            return this.getActiveStyle();
        }
    }
    BML.BMLAnchorElement = BMLAnchorElement;
    // impl
    class HTMLInputElement extends HTMLElement {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get defaultValue() {
            return this.node.defaultValue;
        }
        get accessKey() {
            return this.node.accessKey;
        }
        get disabled() {
            return this.node.disabled;
        }
        set disabled(value) {
            this.node.disabled = value;
        }
        get maxLength() {
            return this.node.maxLength === -1 ? 40 : this.node.maxLength;
        }
        get readOnly() {
            return this.node.readOnly;
        }
        set readOnly(value) {
            if (this.ownerDocument.currentFocus === this && value && !this.node.readOnly) {
                this.ownerDocument.inputApplication?.cancel("readonly");
            }
            this.node.readOnly = value;
        }
        get type() {
            return this.node.type;
        }
        get value() {
            return this.node.value;
        }
        set value(value) {
            this.node.value = value;
        }
        blur() {
            blur(this, this.ownerDocument);
        }
        focus() {
            focus(this, this.ownerDocument);
        }
        internalLaunchInputApplication() {
            let maxLength = this.maxLength;
            let ctype;
            if (this.type.toLowerCase() === "submit") {
                return;
            }
            if (this.ownerDocument.resources.profile === resource_1.Profile.TrProfileC) {
                const wapInputFormat = window.getComputedStyle(this.node).getPropertyValue("---wap-input-format").trim();
                const groups = /^((?<unlimited>\*)|(?<length>\d+))?(?<type>A+|a+|N+|n+|X+|x+|M+|m+)$/.exec(wapInputFormat)?.groups;
                ctype = "all";
                if (groups != null) {
                    const type = groups.type;
                    const length = Number.parseInt(groups.length);
                    if (!Number.isNaN(length)) {
                        maxLength = length;
                    }
                    else if (groups.unlimited !== "*") {
                        maxLength = type.length;
                    }
                    if (type.substring(0, 1) === "N") {
                        ctype = "number";
                    }
                }
            }
            else {
                const characterType = this.node.getAttribute("charactertype")?.toLowerCase();
                if (characterType != null && bml_browser_1.inputCharacters.has(characterType)) {
                    ctype = characterType;
                }
                else {
                    ctype = "all";
                }
            }
            const allowed = bml_browser_1.inputCharacters.get(ctype);
            this.ownerDocument.inputApplication?.launch({
                characterType: ctype,
                allowedCharacters: allowed,
                maxLength,
                value: this.value,
                inputMode: this.type === "password" ? "password" : "text",
                multiline: true,
                callback: (value) => {
                    value = (0, text_1.getTextDecoder)(this.ownerDocument.resources.profile)((0, text_1.getTextEncoder)(this.ownerDocument.resources.profile)(value));
                    value = value.replace(/[\n\r]/g, "").substring(0, maxLength);
                    if (allowed != null) {
                        value = value.split("").filter(x => {
                            return allowed.includes(x);
                        }).join("");
                    }
                    if (this.value !== value) {
                        this.value = value;
                        this.ownerDocument.eventQueue.queueSyncEvent({
                            type: "change",
                            target: this.node,
                        });
                        this.ownerDocument.eventQueue.processEventQueue();
                    }
                }
            });
        }
    }
    BML.HTMLInputElement = HTMLInputElement;
    // impl
    class BMLInputElement extends HTMLInputElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
        get focusStyle() {
            return this.getFocusStyle();
        }
        get activeStyle() {
            return this.getActiveStyle();
        }
    }
    BML.BMLInputElement = BMLInputElement;
    // Cプロファイル
    class HTMLTextAreaElement extends HTMLElement {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get defaultValue() {
            return this.node.defaultValue;
        }
        get form() {
            if (this.node.form == null) {
                return null;
            }
            return nodeToBMLNode(this.node.form, this.ownerDocument);
        }
        get accessKey() {
            return this.node.accessKey;
        }
        get name() {
            return this.node.name;
        }
        get readOnly() {
            return this.node.readOnly;
        }
        set readOnly(value) {
            if (this.ownerDocument.currentFocus === this && value && !this.node.readOnly) {
                this.ownerDocument.inputApplication?.cancel("readonly");
            }
            this.node.readOnly = value;
        }
        get value() {
            return this.node.value;
        }
        set value(value) {
            this.node.value = value;
        }
        internalLaunchInputApplication() {
            this.ownerDocument.inputApplication?.launch({
                characterType: "all",
                maxLength: 240,
                value: this.value,
                inputMode: "text",
                multiline: true,
                callback: (value) => {
                    value = (0, text_1.getTextDecoder)(this.ownerDocument.resources.profile)((0, text_1.getTextEncoder)(this.ownerDocument.resources.profile)(value));
                    value = value.substring(0, 240);
                    // onchangeイベントは運用しない
                    this.value = value;
                }
            });
        }
    }
    BML.HTMLTextAreaElement = HTMLTextAreaElement;
    // Cプロファイル
    class BMLTextAreaElement extends HTMLTextAreaElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
    }
    BML.BMLTextAreaElement = BMLTextAreaElement;
    // Cプロファイル
    class HTMLFormElement extends HTMLElement {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get action() {
            return this.node.action;
        }
        set action(value) {
            this.node.action = value;
        }
        get method() {
            return this.node.method;
        }
        submit() {
            this.ownerDocument.logger.error(`${this.ownerDocument.logger.prefix}HTMLFormElement submit`);
        }
    }
    BML.HTMLFormElement = HTMLFormElement;
    // Cプロファイル
    class BMLFormElement extends HTMLFormElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
    }
    BML.BMLFormElement = BMLFormElement;
    // STD B-24 第二分冊 (2/2) 第二編 付属2 表5-3参照
    // 画像の大きさは固定
    function fixJPEGScaling(resolution, displayWidth, displayHeight, width, height) {
        if (resolution.trim() === "720x480") {
            if (width % 2 != 0) {
                return { width: width - 1, height };
            }
            return { width, height };
        }
        // 960x540座標系のときは1/2にスケーリング
        // ただし表示サイズが960x540であり、画像サイズも960x540の場合はそのまま
        if (displayWidth === "960px" && displayHeight === "540px" && width === 960 && height === 540) {
            return { width, height };
        }
        return { width: Math.floor(width / 2), height: Math.floor(height / 2) };
    }
    // impl
    class HTMLObjectElement extends HTMLElement {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get data() {
            return this.node.data;
        }
        set data(value) {
            this.node.data = value;
        }
        get type() {
            return this.node.type;
        }
    }
    BML.HTMLObjectElement = HTMLObjectElement;
    // impl
    class BMLObjectElement extends HTMLObjectElement {
        get data() {
            const aribData = this.node.getAttribute("arib-data");
            if (aribData == null || aribData == "") {
                return this.node.getAttribute("data") ?? "";
            }
            return aribData;
        }
        version = 0;
        animation;
        effect;
        delete() {
            if (this.animation != null) {
                this.animation.cancel();
                this.effect = undefined;
                this.animation = undefined;
            }
            this.node.querySelector("img")?.remove();
        }
        updateAnimation() {
            if (this.animation == null) {
                return;
            }
            const streamStatus = this.node.getAttribute("streamstatus");
            if (streamStatus === "play") {
                this.animation.play();
            }
            else if (streamStatus === "pause") {
                this.animation.pause();
            }
            else if (streamStatus === "stop") {
                this.animation.cancel();
            }
        }
        set data(value) {
            (async () => {
                if (value == null) {
                    this.delete();
                    this.node.removeAttribute("arib-data");
                    return;
                }
                const aribType = this.node.getAttribute("arib-type");
                this.node.setAttribute("arib-data", value);
                if (value == "") {
                    this.delete();
                    return;
                }
                if ((0, media_type_1.isComponentAudioMediaType)(aribType)) {
                    // (arib-dc://-1\.-1\.-1)?/((?<component_tag>\d+(;?<channel_id>\d+))|-1)
                    const { componentId, channelId } = this.ownerDocument.resources.parseAudioReference(value);
                    if (componentId == null) {
                        return;
                    }
                    this.ownerDocument.browserEventTarget.dispatchEvent(new CustomEvent("audiostreamchanged", {
                        detail: {
                            componentId,
                            channelId: channelId ?? undefined,
                        }
                    }));
                    return;
                }
                // 順序が逆転するのを防止
                this.version = this.version + 1;
                const version = this.version;
                const fetched = this.ownerDocument.resources.fetchLockedResource(value) ?? await this.ownerDocument.resources.fetchResourceAsync(value);
                if (this.version !== version) {
                    return;
                }
                if (!fetched) {
                    this.delete();
                    return;
                }
                let imageUrl;
                const isPNG = aribType?.toLowerCase() === "image/x-arib-png";
                const isMNG = aribType?.toLowerCase() === "image/x-arib-mng";
                let imageWidth;
                let imageHeight;
                if (isPNG || isMNG) {
                    const clutCss = window.getComputedStyle(this.node).getPropertyValue("--clut");
                    const clutUrl = clutCss == null ? null : (0, transpile_css_1.parseCSSValue)(clutCss);
                    const fetchedClut = clutUrl == null ? null : (this.ownerDocument.resources.fetchLockedResource(clutUrl) ?? await this.ownerDocument.resources.fetchResourceAsync(clutUrl))?.data;
                    if (this.version !== version) {
                        return;
                    }
                    if (isMNG) {
                        const clut = fetchedClut == null ? default_clut_1.defaultCLUT : (0, clut_1.readCLUT)(fetchedClut, this.ownerDocument.logger);
                        const keyframes = (0, arib_mng_1.aribMNGToCSSAnimation)(fetched.data, clut);
                        this.delete();
                        if (keyframes == null) {
                            return;
                        }
                        this.effect = new KeyframeEffect(this.node, keyframes.keyframes, keyframes.options);
                        this.animation = new Animation(this.effect);
                        for (const blob of keyframes.blobs) {
                            fetched.blobUrl.set(blob, { blobUrl: blob });
                        }
                        // streamloopingは1固定で運用されるため考慮しない
                        // streamstatus=playのときstreampositionで指定されたフレームから再生開始
                        // streamstatus=stopのとき非表示 streampositionは0にリセットされる
                        // streamstatus=pauseのとき streampositionで指定されたフレームを表示
                        if (this.streamStatus !== "stop") {
                            this.ownerDocument.logger.error(`${this.ownerDocument.logger.prefix}unexpected streamStatus`, this.streamStatus, this.data);
                        }
                        this.updateAnimation();
                        return;
                    }
                    else {
                        imageUrl = fetched.blobUrl.get(fetchedClut);
                        if (imageUrl == null) {
                            const clut = fetchedClut == null ? default_clut_1.defaultCLUT : (0, clut_1.readCLUT)(fetchedClut, this.ownerDocument.logger);
                            const png = (0, arib_png_1.aribPNGToPNG)(fetched.data, clut);
                            const blob = new Blob([png.data], { type: "image/png" });
                            imageUrl = { blobUrl: URL.createObjectURL(blob), width: png.width, height: png.height };
                            fetched.blobUrl.set(fetchedClut, imageUrl);
                        }
                    }
                }
                else if (aribType?.toLowerCase() === "image/jpeg") {
                    imageUrl = fetched.blobUrl.get("BT.709");
                    if (imageUrl == null) {
                        try {
                            const bt601 = await globalThis.createImageBitmap(new Blob([fetched.data]));
                            imageUrl = await (0, arib_jpeg_1.convertJPEG)(bt601);
                            if (this.version !== version) {
                                return;
                            }
                        }
                        catch {
                            this.delete();
                            return;
                        }
                        fetched.blobUrl.set("BT.709", imageUrl);
                    }
                }
                else if (aribType?.toLowerCase() === "image/gif") {
                    imageUrl = { blobUrl: this.ownerDocument.resources.getCachedFileBlobUrl(fetched) };
                }
                else {
                    this.delete();
                    return;
                }
                if (imageUrl == null) {
                    this.delete();
                    return;
                }
                if (this.ownerDocument.resources.profile !== resource_1.Profile.TrProfileC) {
                    if (imageUrl.width != null && imageUrl.height != null && aribType?.toLowerCase() === "image/jpeg") {
                        const resolution = window.getComputedStyle(bmlNodeToNode(this.ownerDocument.documentElement).querySelector("body")).getPropertyValue("--resolution");
                        const { width: displayWidth, height: displayHeight } = window.getComputedStyle(this.node);
                        const { width, height } = fixJPEGScaling(resolution, displayWidth, displayHeight, imageUrl.width, imageUrl.height);
                        imageWidth = width;
                        imageHeight = height;
                    }
                }
                let img = this.node.querySelector("img");
                if (img == null) {
                    img = new Image();
                    this.node.appendChild(img);
                    img.style.position = "absolute";
                    img.style.left = "0px";
                    img.style.top = "0px";
                    img.style.right = "unset";
                    img.style.bottom = "unset";
                    img.style.margin = "0px";
                    img.style.padding = "0px";
                    img.style.borderWidth = "0px";
                    img.style.background = "none";
                    img.style.visibility = "inherit";
                    img.style.display = "block";
                }
                img.src = imageUrl.blobUrl;
                const width = imageWidth ?? imageUrl.width;
                const height = imageHeight ?? imageUrl.height;
                if (width != null && height != null) {
                    img.style.width = width + "px";
                    img.style.height = height + "px";
                }
                else {
                    img.style.width = "100%";
                    img.style.height = "100%";
                }
            })();
        }
        get type() {
            const aribType = this.node.getAttribute("arib-type");
            if (aribType != null) {
                return aribType;
            }
            return this.node.type;
        }
        get normalStyle() {
            return this.getNormalStyle();
        }
        get focusStyle() {
            return this.getFocusStyle();
        }
        get activeStyle() {
            return this.getActiveStyle();
        }
        get accessKey() {
            return this.node.accessKey;
        }
        // 同じidであれば遷移時にも状態を保持する
        get remain() {
            return this.node.getAttribute("remain") === "remain";
        }
        set remain(value) {
            if (value) {
                this.node.setAttribute("remain", "remain");
            }
            else {
                this.node.removeAttribute("remain");
            }
        }
        // MNG
        // streamstatus=playのときstreamPositionは運用しない
        // streamstatus=stopのときstreamPositionは0
        // streamstatus=pauseのとき現在表示設定されているフレームの番号
        get streamPosition() {
            const v = Number.parseInt(this.node.getAttribute("streamposition") ?? "0");
            if (Number.isFinite(v)) {
                return v;
            }
            else {
                return 0;
            }
        }
        // MNG
        // streamstatus=playのときstreamPositionは運用しない
        // streamstatus=stopのときstreamPositionは0以外を設定しても無視される
        // streamstatus=pauseのとき指定されたフレームを表示 フレーム数より大きければ受信機依存
        set streamPosition(value) {
            if (this.streamStatus === "pause") {
                value = Number(value);
                if (Number.isFinite(value)) {
                    this.node.setAttribute("streamposition", value.toString());
                    if (this.effect != null) {
                        const timing = this.effect.getTiming();
                        const duration = Number(timing.duration);
                        const keyframes = this.effect.getKeyframes();
                        const keyframe = keyframes[Math.max(0, Math.min(value, keyframes.length - 1))];
                        this.effect.updateTiming({ delay: -(keyframe.computedOffset * duration) });
                    }
                }
            }
            else {
                if (this.effect != null) {
                    this.effect.updateTiming({ delay: 0 });
                }
                this.node.setAttribute("streamposition", "0");
            }
        }
        static offsetToFrame(keyframes, offset) {
            // offset順でソートされていると仮定
            for (let i = 0; i < keyframes.length; i++) {
                if (keyframes[i].computedOffset <= offset) {
                    return i;
                }
            }
            return 0;
        }
        get streamStatus() {
            const value = this.node.getAttribute("streamstatus");
            if (this.animation != null) {
                if (this.animation.playState === "finished" && value !== "pause") {
                    this.streamStatus = "pause";
                }
            }
            if (value == null) {
                const type = this.type.toLowerCase();
                // stopを取りうる場合初期値はstop (STD-B24 第二分冊 (2/2) 付属2 4.8.5.2 注2)
                if ((0, media_type_1.isAudioMediaType)(type) || type === "image/gif" || type === "image/x-arib-mng") {
                    return "stop";
                }
                return "play";
            }
            return value; // "stop" | "play" | "pause"
        }
        audioBufferSourceNode;
        // STD-B24 第二分冊 (2/2) 付属2 4.8.5.3
        // MNG
        // stop以外の時にdataを変更できない
        // 再生が終了したときはpauseに設定される
        set streamStatus(value) {
            const type = this.type.toLowerCase();
            if ((0, media_type_1.isAiffMediaType)(type)) {
                if (value === "play") {
                    this.audioBufferSourceNode?.stop();
                    this.ownerDocument.resources.fetchResourceAsync(this.data).then(x => {
                        const data = x?.data;
                        if (data == null) {
                            return;
                        }
                        this.audioBufferSourceNode = (0, arib_aiff_1.playAIFF)(this.ownerDocument.audioNodeProvider.getAudioDestinationNode(), data) ?? undefined;
                        this.node.setAttribute("streamstatus", "play");
                        if (this.audioBufferSourceNode != null) {
                            const sourceNode = this.audioBufferSourceNode;
                            sourceNode.onended = () => {
                                if (sourceNode === this.audioBufferSourceNode) {
                                    this.node.setAttribute("streamstatus", "stop");
                                }
                            };
                        }
                    });
                }
                else if (value === "stop") {
                    this.audioBufferSourceNode?.stop();
                    this.audioBufferSourceNode = undefined;
                    this.node.setAttribute("streamstatus", "stop");
                }
                return;
            }
            if (this.animation == null || this.effect == null) {
                this.node.setAttribute("streamstatus", value);
                return;
            }
            if (this.streamStatus === value) {
                return;
            }
            const prevStatus = this.streamStatus;
            if (value === "play") {
                this.node.setAttribute("streamstatus", "play");
                if (prevStatus === "pause") {
                    // pause=>play streampositionに設定されているフレームから再生開始
                    this.animation.play();
                }
                else if (prevStatus === "stop") {
                    // stop=>play 0フレームから再生開始
                    this.streamPosition = 0;
                    this.animation.play();
                }
            }
            else if (value === "pause") {
                this.node.setAttribute("streamstatus", "pause");
                if (prevStatus === "play") {
                    // play=>pause どのフレームを表示するかは受信機依存 streampositionはそのフレームに設定される 繰り返し回数はリセット
                    this.animation.pause();
                    const duration = Number(this.effect.getTiming().duration);
                    this.streamPosition = BMLObjectElement.offsetToFrame(this.effect.getKeyframes(), ((Number(this.animation.currentTime) - Number(this.animation.startTime)) % duration) / duration);
                }
                else if (prevStatus === "stop") {
                    // stop=>pause 0フレーム目が表示される
                    this.streamPosition = 0;
                    this.animation.play();
                    this.animation.pause();
                }
            }
            else if (value === "stop") {
                // play=>stop streampositionは0 繰り返し回数はリセット
                // pause=>stop play=>pauseのときと同様
                this.animation.cancel();
                this.streamPosition = 0;
                this.node.setAttribute("streamstatus", "stop");
            }
        }
        setMainAudioStream(audio_ref) {
            const { componentId, channelId } = this.ownerDocument.resources.parseAudioReference(audio_ref);
            if (componentId == null) {
                return false;
            }
            return this.ownerDocument.setMainAudioStreamCallback?.(componentId, channelId ?? undefined) ?? false;
        }
        getMainAudioStream() {
            const componentId = this.ownerDocument.resources.mainAudioComponentId ?? this.ownerDocument.resources.defaultAudioComponentId;
            const channelId = this.ownerDocument.resources.mainAudioChannelId;
            const prefix = (this.ownerDocument.resources.isInternetContent ? "arib://-1.-1.-1/" /* ? */ : "/");
            const component = componentId.toString(16).padStart(2, "0");
            if (channelId != null) {
                return prefix + component + ";" + channelId;
            }
            else {
                return prefix + component;
            }
        }
        blur() {
            blur(this, this.ownerDocument);
        }
        focus() {
            focus(this, this.ownerDocument);
        }
    }
    BML.BMLObjectElement = BMLObjectElement;
    // Cプロファイル
    class HTMLImageElement extends HTMLElement {
        node;
        version = 0;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get alt() {
            return this.node.alt;
        }
        get src() {
            return this.node.getAttribute("arib-src") ?? "";
        }
        set src(value) {
            (async () => {
                if (value == null) {
                    this.node.src = "";
                    this.node.removeAttribute("arib-src");
                    return;
                }
                this.node.setAttribute("arib-src", value);
                if (value == "") {
                    this.node.src = "";
                    return;
                }
                this.version = this.version + 1;
                const version = this.version;
                const fetched = this.ownerDocument.resources.fetchLockedResource(value) ?? await this.ownerDocument.resources.fetchResourceAsync(value);
                if (this.version !== version) {
                    return;
                }
                if (!fetched) {
                    this.node.src = "";
                    return;
                }
                const isGIF = fetched.data[0] === 0x47 && fetched.data[1] === 0x49 && fetched.data[2] === 0x46;
                // SOIがあればJPEG APP0はないことがあるので見ない
                const isJPEG = fetched.data[0] === 0xff && fetched.data[1] === 0xd8 && fetched.data[2] === 0xff;
                if (!isGIF && !isJPEG) {
                    this.ownerDocument.logger.error(`${this.ownerDocument.logger.prefix}unknown media`, value);
                    return;
                }
                let imageUrl;
                if (isJPEG) {
                    imageUrl = fetched.blobUrl.get("BT.709");
                    if (imageUrl == null) {
                        try {
                            const bt601 = await globalThis.createImageBitmap(new Blob([fetched.data]));
                            imageUrl = await (0, arib_jpeg_1.convertJPEG)(bt601);
                            if (this.version !== version) {
                                return;
                            }
                        }
                        catch {
                            this.node.src = "";
                            return;
                        }
                        fetched.blobUrl.set("BT.709", imageUrl);
                    }
                }
                else if (isGIF) {
                    imageUrl = { blobUrl: this.ownerDocument.resources.getCachedFileBlobUrl(fetched) };
                }
                else {
                    this.node.src = "";
                    return;
                }
                if (imageUrl == null) {
                    this.node.src = "";
                    return;
                }
                this.node.src = imageUrl.blobUrl;
            })();
        }
    }
    BML.HTMLImageElement = HTMLImageElement;
    class BMLImageElement extends HTMLImageElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
    }
    BML.BMLImageElement = BMLImageElement;
    // impl
    class BMLSpanElement extends HTMLElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
        get focusStyle() {
            return this.getFocusStyle();
        }
        get activeStyle() {
            return this.getActiveStyle();
        }
        get accessKey() {
            return this.node.accessKey;
        }
        blur() {
            blur(this, this.ownerDocument);
        }
        focus() {
            focus(this, this.ownerDocument);
        }
    }
    BML.BMLSpanElement = BMLSpanElement;
    // impl
    class HTMLBodyElement extends HTMLElement {
    }
    BML.HTMLBodyElement = HTMLBodyElement;
    // impl
    class BMLBodyElement extends HTMLBodyElement {
        get invisible() {
            return this.node.getAttribute("invisible") === "invisible";
        }
        set invisible(v) {
            v = Boolean(v);
            if (this.ownerDocument.currentFocus instanceof HTMLInputElement && !v) {
                this.ownerDocument.inputApplication?.cancel("invisible");
            }
            if (v) {
                this.node.setAttribute("invisible", "invisible");
            }
            else {
                this.node.removeAttribute("invisible");
            }
            this.ownerDocument.browserEventTarget.dispatchEvent(new CustomEvent("invisible", { detail: v }));
        }
        get normalStyle() {
            return this.getNormalStyle();
        }
    }
    BML.BMLBodyElement = BMLBodyElement;
    // impl
    class HTMLDivElement extends HTMLElement {
    }
    BML.HTMLDivElement = HTMLDivElement;
    // impl
    class BMLDivElement extends HTMLDivElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
        get focusStyle() {
            return this.getFocusStyle();
        }
        get activeStyle() {
            return this.getActiveStyle();
        }
        get accessKey() {
            return this.node.accessKey;
        }
        blur() {
            blur(this, this.ownerDocument);
        }
        focus() {
            focus(this, this.ownerDocument);
        }
    }
    BML.BMLDivElement = BMLDivElement;
    // impl
    class HTMLParagraphElement extends HTMLElement {
    }
    BML.HTMLParagraphElement = HTMLParagraphElement;
    // impl
    class BMLParagraphElement extends HTMLParagraphElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
        get focusStyle() {
            return this.getFocusStyle();
        }
        get activeStyle() {
            return this.getActiveStyle();
        }
        get accessKey() {
            return this.node.accessKey;
        }
        blur() {
            blur(this, this.ownerDocument);
        }
        focus() {
            focus(this, this.ownerDocument);
        }
    }
    BML.BMLParagraphElement = BMLParagraphElement;
    // impl
    class HTMLMetaElement extends HTMLElement {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get content() {
            return this.node.content;
        }
        get name() {
            return this.node.name;
        }
    }
    BML.HTMLMetaElement = HTMLMetaElement;
    // impl
    class HTMLTitleElement extends HTMLElement {
        node;
        constructor(node, ownerDocument) {
            super(node, ownerDocument);
            this.node = node;
        }
        get text() {
            return this.node.text;
        }
    }
    BML.HTMLTitleElement = HTMLTitleElement;
    // impl
    class HTMLScriptElement extends HTMLElement {
    }
    BML.HTMLScriptElement = HTMLScriptElement;
    // impl
    class HTMLStyleElement extends HTMLElement {
    }
    BML.HTMLStyleElement = HTMLStyleElement;
    // impl
    class HTMLHeadElement extends HTMLElement {
    }
    BML.HTMLHeadElement = HTMLHeadElement;
    // impl
    class HTMLPreElement extends HTMLElement {
    }
    BML.HTMLPreElement = HTMLPreElement;
    // impl
    class BMLPreElement extends HTMLPreElement {
        get normalStyle() {
            return this.getNormalStyle();
        }
    }
    BML.BMLPreElement = BMLPreElement;
    // impl
    class HTMLLinkElement extends HTMLElement {
    }
    BML.HTMLLinkElement = HTMLLinkElement;
    // impl
    class BMLBeventElement extends HTMLElement {
    }
    BML.BMLBeventElement = BMLBeventElement;
    function attrToNumber(attr) {
        const n = Number.parseInt(attr ?? "");
        if (Number.isNaN(n)) {
            return null;
        }
        return n;
    }
    // impl
    class BMLBeitemElement extends HTMLElement {
        // とりあえず関連する属性の値が変わったらリセットするようにしているけどこれらの前回発火したときの状態はリセットされることがあるのかは規格を読んでもよくわからない
        // subscribe=false => subscribe=trueでリセットされるのはほぼ確実
        internalTimerFired = false;
        internalModuleUpdateDataEventId;
        internalModuleUpdateVersion;
        internalModuleExistsInDII;
        // key: message_id, value: 前回受信したmessage_version
        internalMessageVersion;
        internalNPTReferred = false;
        get type() {
            return this.node.getAttribute("type") ?? "";
        }
        get esRef() {
            return this.node.getAttribute("es_ref") ?? "";
        }
        set esRef(value) {
            if (value !== this.esRef) {
                this.node.setAttribute("es_ref", value);
                this.internalMessageVersion = undefined;
                this.internalNPTReferred = false;
            }
        }
        get messageId() {
            return attrToNumber(this.node.getAttribute("message_id")) ?? 255;
        }
        set messageId(value) {
            this.node.setAttribute("message_id", String(value));
        }
        get messageVersion() {
            return attrToNumber(this.node.getAttribute("message_version")) ?? 255;
        }
        set messageVersion(value) {
            this.node.setAttribute("message_version", String(value));
        }
        get messageGroupId() {
            return attrToNumber(this.node.getAttribute("message_group_id")) ?? 0;
        }
        // public set messageGroupId(value: number) {
        //     this.node.setAttribute("message_group_id", String(value));
        // }
        get moduleRef() {
            return this.node.getAttribute("module_ref") ?? "";
        }
        set moduleRef(value) {
            if (this.moduleRef !== value) {
                this.node.setAttribute("module_ref", value);
                this.internalModuleUpdateDataEventId = undefined;
                this.internalModuleUpdateVersion = undefined;
                this.internalModuleExistsInDII = undefined;
            }
        }
        get languageTag() {
            return attrToNumber(this.node.getAttribute("language_tag")) ?? 0;
        }
        set languageTag(value) {
            this.node.setAttribute("language_tag", String(value));
        }
        /*
        public get registerId(): number {
            return attrToNumber(this.node.getAttribute("register_id")) ?? 0;
        }
        public set registerId(value: number) {
            this.node.setAttribute("register_id", String(value));
        }
        public get serviceId(): number {
            return attrToNumber(this.node.getAttribute("service_id")) ?? 0;
        }
        public set serviceId(value: number) {
            this.node.setAttribute("service_id", String(value));
        }
        public get eventId(): number {
            return attrToNumber(this.node.getAttribute("event_id")) ?? 0;
        }
        public set eventId(value: number) {
            this.node.setAttribute("event_id", String(value));
        }*/
        get peripheralRef() {
            return this.node.getAttribute("peripheral_ref") ?? "";
        }
        set peripheralRef(value) {
            this.node.setAttribute("peripheral_ref", value);
        }
        get timeMode() {
            return this.node.getAttribute("time_mode") ?? "";
        }
        // public set timeMode(value: DOMString) {
        //     this.node.setAttribute("time_mode", value);
        // }
        get timeValue() {
            return this.node.getAttribute("time_value") ?? "";
        }
        set timeValue(value) {
            if (this.timeValue !== value) {
                this.node.setAttribute("time_value", value);
                this.internalTimerFired = false;
            }
        }
        get objectId() {
            return this.node.getAttribute("object_id") ?? "";
        }
        set objectId(value) {
            this.node.setAttribute("object_id", value);
        }
        get segmentId() {
            return this.node.getAttribute("segment_id") ?? "";
        }
        set segmentId(value) {
            this.node.setAttribute("segment_id", value);
        }
        get subscribe() {
            return this.node.getAttribute("subscribe") === "subscribe";
        }
        dispatchModuleUpdatedEvent(module, status) {
            if (!this.subscribe) {
                return;
            }
            this.ownerDocument.logger.debug(`${this.ownerDocument.logger.prefix}ModuleUpdated`, module, status);
            const onoccur = this.node.getAttribute("onoccur");
            if (!onoccur) {
                return;
            }
            this.ownerDocument.eventQueue.queueAsyncEvent(async () => {
                this.ownerDocument._currentEvent = new BMLBeventEvent({
                    type: "ModuleUpdated",
                    target: this,
                    status,
                    moduleRef: module,
                });
                if (await this.ownerDocument.eventQueue.executeEventHandler(onoccur)) {
                    return true;
                }
                this.ownerDocument._currentEvent = new BMLEvent({ type: undefined, target: null });
                ;
                return false;
            });
            this.ownerDocument.eventQueue.processEventQueue();
        }
        subscribeModuleUpdated() {
            const { componentId, moduleId } = this.ownerDocument.resources.parseURLEx(this.moduleRef);
            if (!this.subscribe || componentId == null || moduleId == null) {
                return;
            }
            if (!this.ownerDocument.resources.getPMTComponent(componentId)) {
                this.dispatchModuleUpdatedEvent(this.moduleRef, 1);
                this.internalModuleExistsInDII = false;
                this.internalModuleUpdateVersion = undefined;
                this.internalModuleUpdateDataEventId = undefined;
                return;
            }
            const dii = this.ownerDocument.resources.getDownloadComponentInfo(componentId);
            if (dii == null) {
                // DII未受信
                return;
            }
            const module = dii.modules.get(moduleId);
            if (module != null) {
                this.dispatchModuleUpdatedEvent(this.moduleRef, 2);
                this.internalModuleExistsInDII = true;
                this.internalModuleUpdateVersion = module.version;
                this.internalModuleUpdateDataEventId = dii.dataEventId;
            }
            else {
                this.dispatchModuleUpdatedEvent(this.moduleRef, 1);
                this.internalModuleExistsInDII = false;
                this.internalModuleUpdateVersion = undefined;
                this.internalModuleUpdateDataEventId = dii.dataEventId;
            }
        }
        internalPMTUpdated(components) {
            const { componentId, moduleId } = this.ownerDocument.resources.parseURLEx(this.moduleRef);
            if (!this.subscribe || componentId == null || moduleId == null) {
                return;
            }
            if (!components.has(componentId)) {
                if (this.internalModuleExistsInDII) {
                    // コンポーネント送出->非送出
                    this.dispatchModuleUpdatedEvent(this.moduleRef, 1);
                }
                this.internalModuleExistsInDII = false;
                this.internalModuleUpdateVersion = undefined;
                this.internalModuleUpdateDataEventId = undefined;
            }
        }
        internalDIIUpdated(updatedComponentId, modules, dataEventId) {
            const { componentId, moduleId } = this.ownerDocument.resources.parseURLEx(this.moduleRef);
            if (!this.subscribe || updatedComponentId !== componentId || moduleId == null) {
                return;
            }
            const module = modules.get(moduleId);
            if (module == null) {
                if (this.internalModuleExistsInDII) {
                    // モジュール送出->非送出
                    this.dispatchModuleUpdatedEvent(this.moduleRef, 1);
                }
                // データイベント更新
                if (this.internalModuleUpdateDataEventId != null && this.internalModuleUpdateDataEventId !== dataEventId) {
                    if (this.internalModuleExistsInDII) {
                        // モジュール送出->モジュール非送出
                        this.dispatchModuleUpdatedEvent(this.moduleRef, 5);
                    }
                }
                this.internalModuleExistsInDII = false;
                this.internalModuleUpdateVersion = undefined;
                this.internalModuleUpdateDataEventId = dataEventId;
            }
            else {
                if (!this.internalModuleExistsInDII) {
                    // モジュール非送出->モジュール送出
                    this.dispatchModuleUpdatedEvent(this.moduleRef, 2);
                }
                else {
                    // 初回DII受信時はイベント発生しないはず
                    if (this.internalModuleUpdateVersion != null) {
                        if (this.internalModuleUpdateVersion !== module.version) {
                            // 更新検出の段階でイベント発生
                            this.dispatchModuleUpdatedEvent(this.moduleRef, 0);
                        }
                    }
                }
                // データイベント更新
                if (this.internalModuleUpdateDataEventId != null && this.internalModuleUpdateDataEventId !== dataEventId) {
                    if (this.internalModuleExistsInDII) {
                        // モジュール送出->モジュール送出
                        this.dispatchModuleUpdatedEvent(this.moduleRef, 6);
                    }
                    else {
                        // モジュール非送出->モジュール送出
                        this.dispatchModuleUpdatedEvent(this.moduleRef, 4);
                    }
                }
                this.internalModuleExistsInDII = true;
                this.internalModuleUpdateVersion = module.version;
                this.internalModuleUpdateDataEventId = dataEventId;
            }
        }
        set subscribe(value) {
            if (Boolean(value)) {
                if (!this.subscribe) {
                    this.internalTimerFired = false;
                    this.internalModuleUpdateDataEventId = undefined;
                    this.internalModuleUpdateVersion = undefined;
                    this.internalModuleExistsInDII = undefined;
                    this.internalMessageVersion = undefined;
                    this.internalNPTReferred = false;
                }
                this.node.setAttribute("subscribe", "subscribe");
                if (this.type === "ModuleUpdated" && this.internalModuleExistsInDII == null) {
                    this.subscribeModuleUpdated();
                }
            }
            else {
                this.node.removeAttribute("subscribe");
            }
        }
    }
    BML.BMLBeitemElement = BMLBeitemElement;
    // impl
    class BMLEvent {
        _data;
        constructor(data) {
            this._data = { ...data };
        }
        get type() { return this._data.type; }
        get target() { return this._data.target; }
    }
    BML.BMLEvent = BMLEvent;
    // impl
    class BMLIntrinsicEvent extends BMLEvent {
        _keyCode;
        constructor(data) {
            super(data);
            this._keyCode = data.keyCode;
        }
        get keyCode() { return this._keyCode; }
    }
    BML.BMLIntrinsicEvent = BMLIntrinsicEvent;
    // impl
    class BMLBeventEvent extends BMLEvent {
        _data;
        constructor(partialData) {
            const data = {
                ...{
                    target: null,
                    status: 0,
                    privateData: "",
                    esRef: "",
                    messageId: 0,
                    messageVersion: 0,
                    messageGroupId: 0,
                    moduleRef: "",
                    languageTag: 0,
                    registerId: 0,
                    serviceId: 0,
                    eventId: 0,
                    peripheralRef: "",
                    object: null,
                    segmentId: null,
                },
                ...partialData,
            };
            super(data);
            this._data = data;
        }
        get status() { return this._data.status; }
        get privateData() { return this._data.privateData; }
        get esRef() { return this._data.esRef; }
        get messageId() { return this._data.messageId; }
        get messageVersion() { return this._data.messageVersion; }
        get messageGroupId() { return this._data.messageGroupId; }
        get moduleRef() { return this._data.moduleRef; }
        get languageTag() { return this._data.languageTag; }
        // public get registerId(): number { return this.registerId; }
        // public get serviceId(): string { return this.serviceId; }
        // public get eventId(): string { return this.eventId; }
        get peripheralRef() { return this._data.peripheralRef; }
        get object() { return this._data.object; }
        get segmentId() { return this._data.segmentId; }
    }
    BML.BMLBeventEvent = BMLBeventEvent;
    // impl
    class DOMImplementation {
        hasFeature(feature, version) {
            return feature.toUpperCase() === "BML" && version === "1.0";
        }
    }
    BML.DOMImplementation = DOMImplementation;
    BML.BMLCSS2Properties = BMLCSS2Properties_1.BMLCSS2Properties;
})(BML || (exports.BML = BML = {}));
//# sourceMappingURL=DOM.js.map