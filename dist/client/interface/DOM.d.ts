import { EventQueue } from "../event_queue";
import { BMLCSS2Properties, BMLCSS2Properties as BMLCSS2Properties_ } from "./BMLCSS2Properties";
import { Resources } from "../resource";
import { Interpreter } from "../interpreter/interpreter";
import { AudioNodeProvider, BMLBrowserEventTarget, InputApplication } from "../bml_browser";
import { type ModuleListEntry } from "../../server/ws_api";
import { DRCSGlyph, DRCSGlyphs } from "../drcs";
import { type Logger } from "../util/logger";
export declare namespace BML {
    type DOMString = string;
    export function nodeToBMLNode(node: globalThis.HTMLInputElement, ownerDocument: BMLDocument): BMLInputElement;
    export function nodeToBMLNode(node: globalThis.HTMLTextAreaElement, ownerDocument: BMLDocument): BMLTextAreaElement;
    export function nodeToBMLNode(node: globalThis.HTMLFormElement, ownerDocument: BMLDocument): BMLFormElement;
    export function nodeToBMLNode(node: globalThis.HTMLBRElement, ownerDocument: BMLDocument): BMLBRElement;
    export function nodeToBMLNode(node: globalThis.HTMLAnchorElement, ownerDocument: BMLDocument): BMLAnchorElement;
    export function nodeToBMLNode(node: globalThis.HTMLHtmlElement, ownerDocument: BMLDocument): BMLBmlElement;
    export function nodeToBMLNode(node: globalThis.HTMLScriptElement, ownerDocument: BMLDocument): HTMLScriptElement;
    export function nodeToBMLNode(node: globalThis.HTMLObjectElement, ownerDocument: BMLDocument): BMLObjectElement;
    export function nodeToBMLNode(node: globalThis.HTMLImageElement, ownerDocument: BMLDocument): BMLImageElement;
    export function nodeToBMLNode(node: globalThis.HTMLHeadElement, ownerDocument: BMLDocument): HTMLHeadElement;
    export function nodeToBMLNode(node: globalThis.HTMLTitleElement, ownerDocument: BMLDocument): HTMLTitleElement;
    export function nodeToBMLNode(node: globalThis.HTMLSpanElement, ownerDocument: BMLDocument): BMLSpanElement;
    export function nodeToBMLNode(node: globalThis.HTMLMetaElement, ownerDocument: BMLDocument): HTMLMetaElement;
    export function nodeToBMLNode(node: globalThis.HTMLStyleElement, ownerDocument: BMLDocument): HTMLStyleElement;
    export function nodeToBMLNode(node: globalThis.HTMLElement, ownerDocument: BMLDocument): HTMLElement | BMLBeventElement | BMLBeitemElement;
    export function nodeToBMLNode(node: globalThis.HTMLBodyElement, ownerDocument: BMLDocument): BMLBodyElement;
    export function nodeToBMLNode(node: globalThis.HTMLParagraphElement, ownerDocument: BMLDocument): BMLParagraphElement;
    export function nodeToBMLNode(node: globalThis.HTMLDivElement, ownerDocument: BMLDocument): BMLDivElement;
    export function nodeToBMLNode(node: globalThis.HTMLHtmlElement, ownerDocument: BMLDocument): BMLBmlElement;
    export function nodeToBMLNode(node: globalThis.HTMLPreElement, ownerDocument: BMLDocument): BMLPreElement;
    export function nodeToBMLNode(node: globalThis.HTMLLinkElement, ownerDocument: BMLDocument): HTMLLinkElement;
    export function nodeToBMLNode(node: globalThis.HTMLElement, ownerDocument: BMLDocument): HTMLElement;
    export function nodeToBMLNode(node: globalThis.Element, ownerDocument: BMLDocument): Element;
    export function nodeToBMLNode(node: globalThis.CDATASection, ownerDocument: BMLDocument): CDATASection;
    export function nodeToBMLNode(node: globalThis.Text, ownerDocument: BMLDocument): Text;
    export function nodeToBMLNode(node: globalThis.CharacterData, ownerDocument: BMLDocument): CharacterData;
    export function nodeToBMLNode(node: globalThis.HTMLAnchorElement, ownerDocument: BMLDocument): BMLAnchorElement;
    export function nodeToBMLNode(node: globalThis.Node, ownerDocument: BMLDocument): Node;
    export function nodeToBMLNode(node: null, ownerDocument: BMLDocument): null;
    export function bmlNodeToNode(node: Node | null): globalThis.Node | null;
    export function htmlElementToBMLHTMLElement(node: globalThis.HTMLElement | null, ownerDocument: BMLDocument): HTMLElement | null;
    export function isFocusable(elem: globalThis.Element): boolean;
    export class Node {
        protected node: globalThis.Node;
        protected ownerDocument: BMLDocument;
        constructor(node: globalThis.Node, ownerDocument: BMLDocument);
        get parentNode(): Node | null;
        get firstChild(): Node | null;
        get lastChild(): Node | null;
        get previousSibling(): Node | null;
        get nextSibling(): Node | null;
    }
    export class CharacterData extends Node {
        protected node: globalThis.CharacterData;
        private flowData?;
        constructor(node: globalThis.CharacterData, ownerDocument: BMLDocument);
        private internalAddFlowData;
        private getParentBlock;
        private createMarquee;
        private flowText;
        internalReflow(): boolean;
        get data(): string;
        set data(value: string);
        get length(): number;
    }
    export class Text extends CharacterData {
    }
    export class CDATASection extends Text {
    }
    export class Document extends Node {
        protected node: globalThis.Document;
        protected _implementation: DOMImplementation;
        constructor(node: globalThis.Document, ownerDocument: BMLDocument);
        get implementation(): DOMImplementation;
        get documentElement(): HTMLElement;
    }
    export abstract class HTMLDocument extends Document {
        protected node: globalThis.HTMLDocument;
        constructor(node: globalThis.HTMLDocument, ownerDocument: BMLDocument);
        getElementById(id: string | null | undefined): HTMLElement | null;
    }
    export class BMLDocument extends HTMLDocument {
        readonly internalBMLNodeInstanceMap: WeakMap<globalThis.Node, Node>;
        _currentFocus: HTMLElement | null;
        _currentEvent: BMLEvent | null;
        readonly interpreter: Interpreter;
        readonly eventQueue: EventQueue;
        readonly resources: Resources;
        readonly browserEventTarget: BMLBrowserEventTarget;
        readonly audioNodeProvider: AudioNodeProvider;
        readonly inputApplication?: InputApplication;
        readonly setMainAudioStreamCallback?: (componentId: number, channelId?: number) => boolean;
        readonly logger: Logger;
        constructor(node: globalThis.HTMLElement, interpreter: Interpreter, eventQueue: EventQueue, resources: Resources, browserEventTarget: BMLBrowserEventTarget, audioNodeProvider: AudioNodeProvider, inputApplication: InputApplication | undefined, setMainAudioStreamCallback: ((componentId: number, channelId?: number) => boolean) | undefined, logger: Logger);
        private readonly _drcsGlyphs;
        internalGetDRCS(fontFamily: string, fontSize: number, char: string): DRCSGlyph | undefined;
        internalLoadDRCS(glyphs: DRCSGlyphs[]): void;
        internalUnloadAllDRCS(): void;
        get documentElement(): HTMLElement;
        get currentFocus(): HTMLElement | null;
        get currentEvent(): BMLEvent | null;
    }
    export class Element extends Node {
        protected node: globalThis.Element;
        constructor(node: globalThis.Element, ownerDocument: BMLDocument);
        get tagName(): string;
    }
    export class HTMLElement extends Element {
        protected node: globalThis.HTMLElement;
        protected normalStyleMap: Map<string, string>;
        protected focusStyleMap: Map<string, string>;
        protected activeStyleMap: Map<string, string>;
        constructor(node: globalThis.HTMLElement, ownerDocument: BMLDocument);
        get id(): string;
        get className(): string;
        internalSetFocus(focus: boolean): void;
        internalSetActive(active: boolean): void;
        private applyStyle;
        private applyDRCSStyle;
        protected getNormalStyle(): BMLCSS2Properties;
        protected getFocusStyle(): BMLCSS2Properties;
        protected getActiveStyle(): BMLCSS2Properties;
    }
    export class HTMLBRElement extends HTMLElement {
    }
    export class BMLBRElement extends HTMLBRElement {
        get normalStyle(): BMLCSS2Properties;
    }
    export class HTMLHtmlElement extends HTMLElement {
    }
    export class BMLBmlElement extends HTMLHtmlElement {
    }
    export class HTMLAnchorElement extends HTMLElement {
        protected node: globalThis.HTMLAnchorElement;
        constructor(node: globalThis.HTMLAnchorElement, ownerDocument: BMLDocument);
        get accessKey(): string;
        get href(): string;
        set href(value: string);
        blur(): void;
        focus(): void;
    }
    export class BMLAnchorElement extends HTMLAnchorElement {
        get normalStyle(): BMLCSS2Properties;
        get focusStyle(): BMLCSS2Properties;
        get activeStyle(): BMLCSS2Properties;
    }
    export class HTMLInputElement extends HTMLElement {
        protected node: globalThis.HTMLInputElement;
        constructor(node: globalThis.HTMLInputElement, ownerDocument: BMLDocument);
        get defaultValue(): string;
        get accessKey(): string;
        get disabled(): boolean;
        set disabled(value: boolean);
        get maxLength(): number;
        get readOnly(): boolean;
        set readOnly(value: boolean);
        get type(): string;
        get value(): string;
        set value(value: string);
        blur(): void;
        focus(): void;
        internalLaunchInputApplication(): void;
    }
    export class BMLInputElement extends HTMLInputElement {
        get normalStyle(): BMLCSS2Properties;
        get focusStyle(): BMLCSS2Properties;
        get activeStyle(): BMLCSS2Properties;
    }
    export class HTMLTextAreaElement extends HTMLElement {
        protected node: globalThis.HTMLTextAreaElement;
        constructor(node: globalThis.HTMLTextAreaElement, ownerDocument: BMLDocument);
        get defaultValue(): string;
        get form(): BMLFormElement | null;
        get accessKey(): string;
        get name(): string;
        get readOnly(): boolean;
        set readOnly(value: boolean);
        get value(): string;
        set value(value: string);
        internalLaunchInputApplication(): void;
    }
    export class BMLTextAreaElement extends HTMLTextAreaElement {
        get normalStyle(): BMLCSS2Properties;
    }
    export class HTMLFormElement extends HTMLElement {
        protected node: globalThis.HTMLFormElement;
        constructor(node: globalThis.HTMLFormElement, ownerDocument: BMLDocument);
        get action(): string;
        set action(value: string);
        get method(): string;
        submit(): void;
    }
    export class BMLFormElement extends HTMLFormElement {
        get normalStyle(): BMLCSS2Properties;
    }
    export class HTMLObjectElement extends HTMLElement {
        protected node: globalThis.HTMLObjectElement;
        constructor(node: globalThis.HTMLObjectElement, ownerDocument: BMLDocument);
        get data(): string;
        set data(value: string);
        get type(): string;
    }
    export class BMLObjectElement extends HTMLObjectElement {
        get data(): string;
        private version;
        protected animation: Animation | undefined;
        protected effect: KeyframeEffect | undefined;
        protected delete(): void;
        protected updateAnimation(): void;
        set data(value: string);
        get type(): string;
        get normalStyle(): BMLCSS2Properties;
        get focusStyle(): BMLCSS2Properties;
        get activeStyle(): BMLCSS2Properties;
        get accessKey(): string;
        get remain(): boolean;
        set remain(value: boolean);
        get streamPosition(): number;
        set streamPosition(value: number);
        static offsetToFrame(keyframes: ComputedKeyframe[], offset: number): number;
        get streamStatus(): DOMString;
        private audioBufferSourceNode?;
        set streamStatus(value: DOMString);
        setMainAudioStream(audio_ref: DOMString): boolean;
        getMainAudioStream(): DOMString | null;
        blur(): void;
        focus(): void;
    }
    export class HTMLImageElement extends HTMLElement {
        protected node: globalThis.HTMLImageElement;
        private version;
        constructor(node: globalThis.HTMLImageElement, ownerDocument: BMLDocument);
        get alt(): string;
        get src(): string;
        set src(value: string);
    }
    export class BMLImageElement extends HTMLImageElement {
        get normalStyle(): BMLCSS2Properties;
    }
    export class BMLSpanElement extends HTMLElement {
        get normalStyle(): BMLCSS2Properties;
        get focusStyle(): BMLCSS2Properties;
        get activeStyle(): BMLCSS2Properties;
        get accessKey(): string;
        blur(): void;
        focus(): void;
    }
    export class HTMLBodyElement extends HTMLElement {
    }
    export class BMLBodyElement extends HTMLBodyElement {
        get invisible(): boolean;
        set invisible(v: boolean);
        get normalStyle(): BMLCSS2Properties;
    }
    export class HTMLDivElement extends HTMLElement {
    }
    export class BMLDivElement extends HTMLDivElement {
        get normalStyle(): BMLCSS2Properties;
        get focusStyle(): BMLCSS2Properties;
        get activeStyle(): BMLCSS2Properties;
        get accessKey(): string;
        blur(): void;
        focus(): void;
    }
    export class HTMLParagraphElement extends HTMLElement {
    }
    export class BMLParagraphElement extends HTMLParagraphElement {
        get normalStyle(): BMLCSS2Properties;
        get focusStyle(): BMLCSS2Properties;
        get activeStyle(): BMLCSS2Properties;
        get accessKey(): string;
        blur(): void;
        focus(): void;
    }
    export class HTMLMetaElement extends HTMLElement {
        protected node: globalThis.HTMLMetaElement;
        constructor(node: globalThis.HTMLMetaElement, ownerDocument: BMLDocument);
        get content(): string;
        get name(): string;
    }
    export class HTMLTitleElement extends HTMLElement {
        protected node: globalThis.HTMLTitleElement;
        constructor(node: globalThis.HTMLTitleElement, ownerDocument: BMLDocument);
        get text(): string;
    }
    export class HTMLScriptElement extends HTMLElement {
    }
    export class HTMLStyleElement extends HTMLElement {
    }
    export class HTMLHeadElement extends HTMLElement {
    }
    export class HTMLPreElement extends HTMLElement {
    }
    export class BMLPreElement extends HTMLPreElement {
        get normalStyle(): BMLCSS2Properties;
    }
    export class HTMLLinkElement extends HTMLElement {
    }
    export class BMLBeventElement extends HTMLElement {
    }
    export class BMLBeitemElement extends HTMLElement {
        internalTimerFired: boolean;
        internalModuleUpdateDataEventId?: number;
        internalModuleUpdateVersion?: number;
        internalModuleExistsInDII?: boolean;
        internalMessageVersion?: Map<number, number>;
        internalNPTReferred: boolean;
        get type(): DOMString;
        get esRef(): DOMString;
        set esRef(value: DOMString);
        get messageId(): number;
        set messageId(value: number);
        get messageVersion(): number;
        set messageVersion(value: number);
        get messageGroupId(): number;
        get moduleRef(): DOMString;
        set moduleRef(value: DOMString);
        get languageTag(): number;
        set languageTag(value: number);
        get peripheralRef(): DOMString;
        set peripheralRef(value: DOMString);
        get timeMode(): string;
        get timeValue(): DOMString;
        set timeValue(value: DOMString);
        get objectId(): DOMString;
        set objectId(value: DOMString);
        get segmentId(): DOMString;
        set segmentId(value: DOMString);
        get subscribe(): boolean;
        private dispatchModuleUpdatedEvent;
        private subscribeModuleUpdated;
        internalPMTUpdated(components: ReadonlySet<number>): void;
        internalDIIUpdated(updatedComponentId: number, modules: ReadonlyMap<number, ModuleListEntry>, dataEventId: number): void;
        set subscribe(value: boolean);
    }
    interface BMLEventData {
        type: string | undefined;
        target: HTMLElement | null;
    }
    interface BMLIntrinsicEventData extends BMLEventData {
        keyCode: number;
    }
    interface BMLBeventEventData extends BMLEventData {
        status: number;
        privateData: string;
        esRef: string;
        messageId: number;
        messageVersion: number;
        messageGroupId: number;
        moduleRef: string;
        languageTag: number;
        registerId: number;
        serviceId: number;
        eventId: number;
        peripheralRef: string;
        object: BMLObjectElement | null;
        segmentId: string | null;
    }
    export class BMLEvent {
        protected _data: BMLEventData;
        constructor(data: BMLEventData);
        get type(): DOMString | undefined;
        get target(): HTMLElement | null;
    }
    export class BMLIntrinsicEvent extends BMLEvent {
        protected _keyCode: number;
        constructor(data: BMLIntrinsicEventData);
        get keyCode(): number;
    }
    export class BMLBeventEvent extends BMLEvent {
        protected _data: BMLBeventEventData;
        constructor(partialData: Partial<BMLBeventEventData> & BMLEventData);
        get status(): number;
        get privateData(): string;
        get esRef(): string;
        get messageId(): number;
        get messageVersion(): number;
        get messageGroupId(): number;
        get moduleRef(): string;
        get languageTag(): number;
        get peripheralRef(): string;
        get object(): BMLObjectElement | null;
        get segmentId(): string | null;
    }
    export class DOMImplementation {
        hasFeature(feature: string, version: string): boolean;
    }
    export const BMLCSS2Properties: typeof BMLCSS2Properties_;
    export {};
}
//# sourceMappingURL=DOM.d.ts.map