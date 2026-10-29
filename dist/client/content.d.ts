import { Resources } from "./resource";
import { BML } from "./interface/DOM";
import { ResponseMessage } from "../server/ws_api";
import { EventDispatcher, EventQueue } from "./event_queue";
import { Interpreter } from "./interpreter/interpreter";
import { BMLBrowserEventTarget, Indicator, InputApplication } from "./bml_browser";
import { DRCSGlyphs } from "./drcs";
import { type Logger } from "./util/logger";
export declare enum AribKeyCode {
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
    Back = 19,// X
    DataButton = 20,
    BlueButton = 21,// B
    RedButton = 22,// R
    GreenButton = 23,// G
    YellowButton = 24,// Y
    DataButton1 = 25,// E
    DataButton2 = 26,// F
    Bookmark = 100,
    TVLink = 100,
    Star = 101,
    Hash = 102
}
export declare function keyCodeToAribKey(keyCode: string): AribKeyCode | -1;
export type LaunchDocumentOptions = {
    withLink?: boolean;
};
/** P1: what a page is subscribed to, and whether each subscription has ever fired. */
export type BeitemInspection = {
    type: string;
    /** module_ref or es_ref, as written in the markup */
    ref: string | null;
    subscribe: boolean;
    hasHandler: boolean;
    /** how many bevent handlers of this type have been invoked for this ref */
    fired: number;
};
export type PageInspection = {
    document: string | null;
    requested: string | null;
    phase: string;
    phaseAgeMs: number;
    detail: string | null;
    /** the `resolution` the document declared, and the box the engine then laid out */
    resolution: {
        declared: string | null;
        width: number;
        height: number;
        displayAspectRatio: string | null;
    } | null;
    profile: string;
    /** true while the body still carries arib-loading: the engine is mid-parse */
    bodyLoading: boolean;
    /** the entry module has been delivered and startup was launched */
    startupDelivered: boolean;
    invisible: boolean | undefined;
    elements: number;
    beitems: BeitemInspection[];
};
export declare class Content {
    private documentElement;
    private resources;
    private eventQueue;
    private eventDispatcher;
    private interpreter;
    readonly bmlDocument: BML.BMLDocument;
    private videoContainer;
    private bmlEventTarget;
    private indicator?;
    private fonts;
    private readonly videoPlaneModeEnabled;
    private readonly tunnelPointerToVideoPlaneEnabled;
    private loaded;
    /** P1: 起動の世代番号 (Content#startupDelivered と合わせて読み込み状態を表す) */
    private launchToken;
    private readonly inputApplication?;
    private npt?;
    private uaStyle?;
    private readonly showErrorMessage;
    private readonly logger;
    constructor(bmlDocument: BML.BMLDocument, documentElement: HTMLElement, resources: Resources, eventQueue: EventQueue, eventDispatcher: EventDispatcher, interpreter: Interpreter, videoContainer: HTMLElement, bmlEventTarget: BMLBrowserEventTarget, indicator: Indicator | undefined, videoPlaneModeEnabled: boolean, tunnelPointerToVideoPlaneEnabled: boolean, inputApplication: InputApplication | undefined, showErrorMessage: ((title: string, message: string, code?: string) => void) | undefined, logger: Logger);
    /**
     * P6: decode with the charset the resource declares, falling back to the profile's default.
     *
     * `file` is optional because one caller has no resource at all — an event message's private data
     * — and that is text the *stream* defined, not a document that carries a declaration.
     */
    private decodeText;
    private _currentDateMode;
    set currentDateMode(timeMode: number);
    get currentDateMode(): number;
    private getBody;
    private tunnelPointerToVideoPlane;
    private clipVideoPlane;
    private replaceTextCDATA;
    private loadDocumentToDOM;
    private focusHelper;
    unloadAllDRCS(): void;
    private _context;
    get context(): any;
    private unloadDocument;
    exitDocument(): Promise<void>;
    quitDocument(): Promise<void>;
    fail(title: string, message: string, code?: string): Promise<void>;
    private isFocusable;
    private focusFirstNavIndex;
    private shimCProfileNavigation;
    private loadDocument;
    private processTimerEvent;
    launchDocument(documentName: string, options?: LaunchDocumentOptions): number;
    private launchStartup;
    private launchDocumentAsync;
    private findNavIndex;
    private keyProcessStatus?;
    processKeyDown(k: AribKeyCode): void;
    private focusNextNavIndex;
    focusFragment(fragment: string): void;
    processKeyUp(k: AribKeyCode): void;
    private clutToDecls;
    private getCLUT;
    private convertCSSUrl;
    private loadObjects;
    pcrBase?: number;
    getNPT90kHz(): number | null;
    onMessage(msg: ResponseMessage): void;
    loadDRCS(glyphs: DRCSGlyphs[]): void;
    /**
     * P1: the page as the host can see it — what document is up, what phase it is in, and every
     * beitem subscription with the number of times its handler actually ran. A subscription that
     * has never fired is the single most common reason a page sits on 読み込み中, and before this
     * the host had no way to tell it apart from a page that simply looks like that.
     */
    inspect(): PageInspection;
    addDRCSFont(font: FontFace): void;
    get invisible(): boolean | undefined;
    private defaultShowErrorMessage;
}
//# sourceMappingURL=content.d.ts.map