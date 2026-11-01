import { BML } from "./dom/bml_dom";
import { Interpreter } from "./interpreter/interpreter";
import { Resources } from "./resource";
import { type Logger } from "./util/logger";
interface BMLEvent {
    type: string;
    target: HTMLElement | null;
}
type BMLObjectElement = HTMLObjectElement;
interface BMLIntrinsicEvent extends BMLEvent {
    keyCode: number;
}
interface BMLBeventEvent extends BMLEvent {
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
export type SyncFocusEvent = {
    type: "focus";
    target: HTMLElement;
};
export type SyncBlurEvent = {
    type: "blur";
    target: HTMLElement;
};
export type SyncClickEvent = {
    type: "click";
    target: HTMLElement;
};
export type SyncChangeEvent = {
    type: "change";
    target: HTMLElement;
};
export type SyncEvent = SyncFocusEvent | SyncBlurEvent | SyncClickEvent | SyncChangeEvent;
export declare class EventDispatcher {
    private readonly eventQueue;
    private readonly bmlDocument;
    private readonly resources;
    private readonly logger;
    constructor(eventQueue: EventQueue, bmlDocument: BML.BMLDocument, resources: Resources, logger: Logger);
    setCurrentEvent(a: BMLEvent): void;
    setCurrentIntrinsicEvent(a: BMLIntrinsicEvent): void;
    setCurrentBeventEvent(ev: Partial<BMLBeventEvent> & BMLEvent): void;
    resetCurrentEvent(): void;
    dispatchModuleLockedEvent(module: string, isEx: boolean, status: number): void;
    dispatchTimerFiredEvent(status: number, beitem: Element): void;
    dispatchDataButtonPressedEvent(): void;
    dispatchMainAudioStreamChangedEvent(prevComponentId: number, prevChannelId: number | undefined, componentId: number, channelId: number | undefined): void;
    dispatchFocus(event: SyncFocusEvent): Promise<boolean>;
    dispatchBlur(event: SyncBlurEvent): Promise<boolean>;
    dispatchClick(event: SyncClickEvent): Promise<boolean>;
    dispatchChange(event: SyncChangeEvent): Promise<boolean>;
}
type BMLTimerID = number;
/** The four synchronous DOM events EventQueue forwards to the document's dispatcher. */
export interface SyncEventDispatcher {
    dispatchFocus(event: SyncFocusEvent): Promise<boolean>;
    dispatchBlur(event: SyncBlurEvent): Promise<boolean>;
    dispatchClick(event: SyncClickEvent): Promise<boolean>;
    dispatchChange(event: SyncChangeEvent): Promise<boolean>;
}
export declare class EventQueue {
    private readonly interpreter;
    private readonly logger;
    private dispatcher;
    /** Reported to the owner so a handler failure reaches getDiagnostics(), not only the log. */
    onHandlerFailure?: (kind: string, error: unknown) => void;
    constructor(interpreter: Interpreter, logger: Logger);
    /**
     * Wires the dispatcher once both objects exist: EventDispatcher needs this queue and the queue
     * needs its four handlers, so the cycle is broken with one call instead of four field writes.
     */
    attachDispatcher(dispatcher: SyncEventDispatcher): void;
    private get syncDispatcher();
    executeEventHandler(handler: string): Promise<boolean>;
    private readonly timerHandles;
    setInterval(handler: TimerHandler, timeout: number, ...args: any[]): BMLTimerID;
    pauseTimer(timerID: BMLTimerID): boolean;
    resumeTimer(timerID: BMLTimerID): boolean;
    clearInterval(timerID: BMLTimerID): boolean;
    private asyncEventQueue;
    private syncEventQueue;
    private syncEventQueueLockCount;
    processEventQueue(): Promise<boolean>;
    /**
     * An event handler that throws is contained to its own event: the queue keeps draining and the
     * promise returned by processEventQueue never rejects, which is what the fire-and-forget call
     * sites assume.
     */
    private failEvent;
    queueSyncEvent(event: SyncEvent): void;
    queueAsyncEvent(callback: () => Promise<boolean>): void;
    queueGlobalAsyncEvent(callback: () => Promise<boolean>): void;
    lockSyncEventQueue(): void;
    unlockSyncEventQueue(): void;
    private discarded;
    discard(): void;
    private clear;
    reset(): void;
}
export {};
//# sourceMappingURL=event_queue.d.ts.map