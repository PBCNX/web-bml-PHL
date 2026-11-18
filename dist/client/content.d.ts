import { Resources } from "./resource";
import { BML } from "./dom/bml_dom";
import { ResponseMessage } from "../protocol/messages";
import { EventDispatcher, EventQueue } from "./event_queue";
import { Interpreter } from "./interpreter/interpreter";
import { BMLBrowserEventTarget, Indicator, InputApplication } from "./contracts";
import { DRCSGlyphs } from "./media/drcs";
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
export type KeyProcessStatus = {
    keyCode: AribKeyCode;
    isAccessKey: boolean;
    /** When the DOWN was accepted (ms). A status older than a press means a lost UP, not a held key. */
    startedAt: number;
};
/**
 * 3.1.1: what a new key DOWN does to a status that is still set.
 *
 * A status is set by `processKeyDown` and cleared by the matching `processKeyUp`. An UP can be lost —
 * the page navigates, the event queue is reset on the way, the host drops it — and the old code then
 * ignored every later key for the rest of the document's life (`if (keyProcessStatus != null) return`).
 * ARIB keys are discrete presses, so the answer is always "take the new press"; the verdict only says
 * what the log should call it.
 */
export declare function arbitrateKeyDown(held: KeyProcessStatus | undefined, keyCode: AribKeyCode, now: number): {
    replaced: "none" | "re-press" | "lost-up";
    ageMs: number;
    heldKeyCode: AribKeyCode | null;
};
/**
 * 3.1.1: what a key UP does to the status. The matching code releases it; any other code means the
 * release of the held key was lost, so the held status is cleared rather than kept for ever.
 */
export declare function arbitrateKeyUp(held: KeyProcessStatus | undefined, keyCode: AribKeyCode): "release" | "release-mismatch" | "nothing";
export declare function requestAnimationFrameAsync(timeoutMillis?: number): Promise<void>;
/**
 * 3.1.0: run `callback` in the next animation frame, and say whether a frame will actually come.
 *
 * `requestAnimationFrame` runs only while the document is being rendered: a hidden, occluded or
 * background window throttles or stops it (the same fact `requestAnimationFrameAsync` works around
 * for the load itself). So "the callback ran" is the honest answer to "did this page reach the
 * screen", and returning false (a host with no requestAnimationFrame) means it cannot have.
 */
export declare function onNextFrame(callback: () => void): boolean;
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
    /**
     * 3.1.0: the current document has produced a frame since it was loaded. `invisible` says what the
     * document asked for; this says whether it actually reached the screen. Cleared at every load and
     * at exit, set by the first animation frame after the load dispatch (see `onNextFrame`).
     */
    private pagePainted;
    /** P1: 起動の世代番号 (Content#startupDelivered と合わせて読み込み状態を表す) */
    private launchToken;
    private readonly inputApplication?;
    private npt?;
    private uaStyle?;
    private readonly showErrorMessage;
    private readonly logger;
    constructor(bmlDocument: BML.BMLDocument, documentElement: HTMLElement, resources: Resources, eventQueue: EventQueue, eventDispatcher: EventDispatcher, interpreter: Interpreter, videoContainer: HTMLElement, bmlEventTarget: BMLBrowserEventTarget, indicator: Indicator | undefined, options: ContentOptions);
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
    /**
     * 2.4.0: the pointer as the remote. The element at these coordinates (CSS px) that the profile would
     * actually focus - the owner of the inherited `--nav-index` - or null.
     *
     * The page lives in a **closed shadow root**, so `document.elementFromPoint` stops at the shadow
     * host and never sees a page element; the hit test runs on the root the page is in instead
     * (`ShadowRoot.elementFromPoint`, which a desktop host measured as the working form).
     *
     * A hit element only counts when it carries a `--nav-index` (the property is inherited, so the
     * element at the point may be a child of the owner); the owner is found with the same `findNavIndex`
     * the remote uses. Accepting anything `isFocusable` - images, the host - sent TV5's Channel Guide
     * click to the wrong item, so the nav-index is the rule, not focusability alone.
     */
    elementAt(x: number, y: number): HTMLElement | null;
    /**
     * 2.4.0: the pointer as the remote. Focuses the element `elementAt` finds and does exactly what the
     * Enter key does: `internalSetActive`, the same synchronous `click` event, `processEventQueue`, and
     * an anchor's `href` (launch or fragment) - so `onfocus` precedes `onclick` and a link actually
     * navigates, as on the box.
     *
     * Returns false when nothing nav-indexed is under the point, **including the page root**: a host's
     * fallback must run rather than believe the page took the click (GMA has a single hidden element,
     * so a click on the page body is not a click the page handles).
     */
    clickAt(x: number, y: number): boolean;
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
    private loadDocumentInner;
    private processTimerEvent;
    private launchStartup;
    /**
     * Whether the pressed key belongs to a key group the page enabled through `--used-key-list`.
     * `none` disables everything; an empty list leaves only the basic and data-button groups live
     * (STD-B24 第二分冊(2/2) 第二編 付属1 5.1.3).
     */
    private isKeyGroupEnabled;
    /**
     * Runs one event handler with the synchronous queue locked. Returns true when the handler
     * reported that execution ended (a navigation): the lock is then left held, because the
     * incoming document owns the queue from that point.
     */
    private runHandlerLocked;
    /**
     * Runs a lifecycle step started from a listener or queued callback and records a failure.
     * Without this an unexpected throw becomes an unhandled rejection that no diagnostics entry
     * ever mentions, which is exactly the "page is stuck and nothing says why" case.
     */
    private runLifecycle;
    /**
     * Starts a document transition; the promise settles when the new document has been launched.
     * The ARIB-facing callers cannot await it — they throw to unwind the interpreter — so they
     * attach a catch, which keeps a failed launch from becoming an unhandled rejection.
     */
    launchDocument(documentName: string, options?: LaunchDocumentOptions): Promise<void>;
    private findNavIndex;
    private keyProcessStatus?;
    /**
     * 3.1.1: which element a key handler runs on. A key event belongs to the focused element, but a
     * page may put its handler on an ancestor — body is the common case — and with nothing focused the
     * document is the only candidate. The nearest element carrying the attribute wins, so one press
     * runs at most one handler (an already-handled event is not bubbled).
     */
    private keyHandlerTarget;
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
    /**
     * 3.1.0: a frame of the current document has actually been produced. False until then, false on a
     * host that cannot paint at all, and false while a hidden or occluded window stops
     * requestAnimationFrame. `invisible` answers a different question (what the document asked for).
     */
    get painted(): boolean;
    private defaultShowErrorMessage;
}
//# sourceMappingURL=content.d.ts.map