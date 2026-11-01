// BML is a runtime namespace here (nodeToBMLNode), so this edge stays a value import.
import { BML } from "./dom/bml_dom";
import { Interpreter } from "./interpreter/interpreter";
import { Resources } from "./resource";
import { type Logger } from "./util/logger";
import { formatModuleRef } from "./format";

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

// 同期割り込み事象キュー
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

/** 2.4.5: how many identical ModuleLocked events one module+status may produce per second. */
export const MODULE_LOCKED_BURST_LIMIT = 16;

export class EventDispatcher {
    private readonly eventQueue: EventQueue;
    private readonly bmlDocument: BML.BMLDocument;
    private readonly resources: Resources;
    private readonly logger: Logger;

    /** 2.4.5: ModuleLocked bursts, keyed by module and status. */
    private readonly moduleLockedStorm = new Map<string, { count: number, firstAt: number, reported?: boolean }>();
    public constructor(eventQueue: EventQueue, bmlDocument: BML.BMLDocument, resources: Resources, logger: Logger) {
        this.eventQueue = eventQueue;
        this.bmlDocument = bmlDocument;
        this.resources = resources;
        this.logger = logger;
    }

    public setCurrentEvent(a: BMLEvent) {
        const { target: _, ...b } = a;
        const c = { target: BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), ...b }
        this.bmlDocument._currentEvent = new BML.BMLEvent(c);
    }

    public setCurrentIntrinsicEvent(a: BMLIntrinsicEvent) {
        const { target: _, ...b } = a;
        const c = { target: BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), ...b }
        this.bmlDocument._currentEvent = new BML.BMLIntrinsicEvent(c);
    }

    public setCurrentBeventEvent(ev: Partial<BMLBeventEvent> & BMLEvent) {
        const a: BMLBeventEvent = {
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
            }, ...ev
        };
        // P1: beitemのハンドラが実際に呼ばれたことを記録する。「イベントが発火したか」は
        // ページが読み込み中で止まる理由のうち最も多いもの
        this.resources.diagnostics.event(String(a.type ?? ""), a.moduleRef || a.esRef || null, a.status ?? null);
        const { target: _1, object: _2, ...b } = a;
        const c = { target: BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), object: BML.htmlElementToBMLHTMLElement(a.object, this.bmlDocument) as (BML.BMLObjectElement | null), ...b }
        this.bmlDocument._currentEvent = new BML.BMLBeventEvent(c);
    }

    // setInterval/グローバルコードのとき (STD-B24 第二分冊 (2/2) 第二編 付属2 表 4-16、STD-B24 第二分冊 (2/2) 第二編 付属4 表 4-12)
    public resetCurrentEvent() {
        this.bmlDocument._currentEvent = new BML.BMLEvent({ type: undefined, target: null });
    }

    /**
     * 2.4.5: how many identical ModuleLocked events are allowed in one second per module+status.
     *
     * A page that re-locks a module whenever the status is not 0 (ABS's `onLkDMdl` does exactly that:
     * `unlockModuleOnMemoryEx(mr); lockModuleOnMemoryEx(mr);`) turns one failing lock into an endless
     * stream when the engine keeps answering with the same failure — /50/3001 is not in the ABS DII, so
     * the answer is -2 every time. The queue then never leaves `processEventQueue`, timers stop, and the
     * host sees a frozen page (BMLPLAYER, ABS 3201, 2026-11-02). One page mistake must not stop the
     * receiver, so the burst is capped and logged once.
     */
    public allowedModuleLockedEvent(module: string, status: number, now: number): boolean {
        const key = `${module}:${status}`;
        const entry = this.moduleLockedStorm.get(key);
        if (entry == null || now - entry.firstAt > 1000) {
            this.moduleLockedStorm.set(key, { count: 1, firstAt: now });
            return true;
        }
        entry.count++;
        return entry.count <= MODULE_LOCKED_BURST_LIMIT;
    }

    public dispatchModuleLockedEvent(module: string, isEx: boolean, status: number) {
        if (!this.allowedModuleLockedEvent(module, status, performance.now())) {
            // Log once per second at most: the page loops, the log must not.
            const key = `${module}:${status}`;
            const entry = this.moduleLockedStorm.get(key);
            if (entry != null && !entry.reported) {
                entry.reported = true;
                this.logger.error(`ModuleLocked burst`, module, status, `more than ${MODULE_LOCKED_BURST_LIMIT} in one second; suppressed`);
            }
            return;
        }
        this.logger.debug(`ModuleLocked`, module);
        const moduleLocked = (BML.bmlNodeToNode(this.bmlDocument.documentElement) as HTMLElement).querySelectorAll("beitem[type=\"ModuleLocked\"]");
        const { componentId, moduleId } = this.resources.parseURLEx(module);
        // P1: このロックに対してModuleLockedが実際に送出されたかどうかを、ロック記録に結び付ける
        if (componentId != null && moduleId != null) {
            this.resources.diagnostics.moduleLockedEvent(formatModuleRef(componentId, moduleId), isEx, status);
        }
        for (const beitem of Array.from(moduleLocked)) {
            if (beitem.getAttribute("subscribe") !== "subscribe") {
                continue;
            }
            const moduleRef = beitem.getAttribute("module_ref");
            const { componentId: refComponentId, moduleId: refModuleId } = this.resources.parseURLEx(moduleRef);
            if (componentId === refComponentId && moduleId == refModuleId) {
                const onoccur = beitem.getAttribute("onoccur");
                if (onoccur) {
                    this.eventQueue.queueAsyncEvent(async () => {
                        this.setCurrentBeventEvent({
                            type: "ModuleLocked",
                            target: beitem as HTMLElement,
                            status,
                            moduleRef: module,
                        } as BMLBeventEvent);
                        if (await this.eventQueue.executeEventHandler(onoccur)) {
                            return true;
                        }
                        this.resetCurrentEvent();
                        return false;
                    });
                    this.eventQueue.processEventQueue();
                }
            }
        }
    }

    public dispatchTimerFiredEvent(status: number, beitem: Element) {
        this.logger.debug(`TimerFired`, status);
        if (beitem.getAttribute("subscribe") !== "subscribe") {
            return;
        }
        const onoccur = beitem.getAttribute("onoccur");
        if (onoccur) {
            this.eventQueue.queueAsyncEvent(async () => {
                this.setCurrentBeventEvent({
                    type: "TimerFired",
                    target: beitem as HTMLElement,
                    status,
                });
                if (await this.eventQueue.executeEventHandler(onoccur)) {
                    return true;
                }
                this.resetCurrentEvent();
                return false;
            });
            this.eventQueue.processEventQueue();
        }
    }

    public dispatchDataButtonPressedEvent() {
        this.logger.log(`DataButtonPressed`);
        const moduleLocked = (BML.bmlNodeToNode(this.bmlDocument.documentElement) as HTMLElement).querySelectorAll("beitem[type=\"DataButtonPressed\"]");
        for (const beitem of Array.from(moduleLocked)) {
            if (beitem.getAttribute("subscribe") !== "subscribe") {
                continue;
            }
            const onoccur = beitem.getAttribute("onoccur");
            if (onoccur) {
                this.eventQueue.queueAsyncEvent(async () => {
                    this.setCurrentBeventEvent({
                        type: "DataButtonPressed",
                        target: beitem as HTMLElement,
                        status: 0,
                    });
                    if (await this.eventQueue.executeEventHandler(onoccur)) {
                        return true;
                    }
                    this.resetCurrentEvent();
                    return false;
                });
                this.eventQueue.processEventQueue();
            }
        }
    }

    public dispatchMainAudioStreamChangedEvent(prevComponentId: number, prevChannelId: number | undefined, componentId: number, channelId: number | undefined): void {
        this.logger.log(`MainAudioStreamChanged`);
        const moduleLocked = (BML.bmlNodeToNode(this.bmlDocument.documentElement) as HTMLElement).querySelectorAll("beitem[type=\"MainAudioStreamChanged\"]");
        for (const beitem of Array.from(moduleLocked)) {
            if (beitem.getAttribute("subscribe") !== "subscribe") {
                continue;
            }
            const onoccur = beitem.getAttribute("onoccur");
            if (!onoccur) {
                continue;
            }
            const es_ref = beitem.getAttribute("es_ref");
            let selected: boolean;
            if (es_ref) {
                const { componentId: refComponentId, channelId: refChannelId } = this.resources.parseAudioReference(es_ref);
                if (refComponentId == null) {
                    continue;
                }
                // チャンネルID未指定で主/副切り替えの場合イベントは発生しない
                if (refChannelId == null && prevComponentId === componentId) {
                    continue;
                }
                // es_ref のチャンネル ID が変更前または変更後の音声と一致する場合だけ通知する
                const unselected = refComponentId === prevComponentId && (refChannelId == null || refChannelId === prevChannelId);
                selected = refComponentId === componentId && (refChannelId == null || refChannelId === channelId);
                if (!selected && !unselected) {
                    continue;
                }
            } else {
                // 省略した場合商品企画 (TR-14)
                selected = true;
            }
            const prefix = (this.resources.isInternetContent ? "arib://-1.-1.-1/" /* ? */ : "/");
            const component = componentId.toString(16).padStart(2, "0");
            let esRef: string;
            if (channelId != null) {
                esRef = prefix + component + ";" + channelId;
            } else {
                esRef = prefix + component;
            }
            this.eventQueue.queueAsyncEvent(async () => {
                this.setCurrentBeventEvent({
                    type: "MainAudioStreamChanged",
                    target: beitem as HTMLElement,
                    esRef,
                    status: selected ? 1 : 0, // 0: 選択解除 1: 選択
                });
                if (await this.eventQueue.executeEventHandler(onoccur)) {
                    return true;
                }
                this.resetCurrentEvent();
                return false;
            });
            this.eventQueue.processEventQueue();
        }
    }

    async dispatchFocus(event: SyncFocusEvent): Promise<boolean> {
        this.setCurrentEvent({
            type: "focus",
            target: event.target,
        } as BMLEvent);
        const handler = event.target.getAttribute("onfocus");
        if (handler) {
            if (await this.eventQueue.executeEventHandler(handler)) {
                return true;
            }
        }
        this.resetCurrentEvent();
        if (event.target instanceof HTMLInputElement) {
            // TR-B14 第二分冊 1.6.1 focus割り込み事象の発生の後、直ちに文字入力アプリを起動
            if (event.target.getAttribute("inputmode") === "direct") {
                BML.nodeToBMLNode(event.target, this.bmlDocument).internalLaunchInputApplication();
            }
        }
        return false;
    }

    async dispatchBlur(event: SyncBlurEvent): Promise<boolean> {
        this.setCurrentEvent({
            type: "blur",
            target: event.target,
        } as BMLEvent);
        const handler = event.target.getAttribute("onblur");
        if (handler) {
            if (await this.eventQueue.executeEventHandler(handler)) {
                return true;
            }
        }
        this.resetCurrentEvent();
        return false;
    }

    async dispatchClick(event: SyncClickEvent): Promise<boolean> {
        this.setCurrentEvent({
            type: "click",
            target: event.target,
        } as BMLEvent);
        const handler = event.target.getAttribute("onclick");
        if (handler) {
            if (await this.eventQueue.executeEventHandler(handler)) {
                return true;
            }
        }
        this.resetCurrentEvent();
        return false;
    }

    async dispatchChange(event: SyncChangeEvent): Promise<boolean> {
        this.setCurrentEvent({
            type: "change",
            target: event.target,
        } as BMLEvent);
        const handler = event.target.getAttribute("onchange");
        if (handler) {
            if (await this.eventQueue.executeEventHandler(handler)) {
                return true;
            }
        }
        this.resetCurrentEvent();
        return false;
    }

}

type Timer = {
    handle: number | null,
    handler: TimerHandler,
    timeout: number,
};

type BMLTimerID = number;

/** The four synchronous DOM events EventQueue forwards to the document's dispatcher. */
export interface SyncEventDispatcher {
    dispatchFocus(event: SyncFocusEvent): Promise<boolean>;
    dispatchBlur(event: SyncBlurEvent): Promise<boolean>;
    dispatchClick(event: SyncClickEvent): Promise<boolean>;
    dispatchChange(event: SyncChangeEvent): Promise<boolean>;
}

export class EventQueue {
    private readonly interpreter: Interpreter;
    private readonly logger: Logger;
    private dispatcher: SyncEventDispatcher | null = null;

    /** Reported to the owner so a handler failure reaches getDiagnostics(), not only the log. */
    public onHandlerFailure?: (kind: string, error: unknown) => void;

    public constructor(interpreter: Interpreter, logger: Logger) {
        this.interpreter = interpreter;
        this.logger = logger;
    }

    /**
     * Wires the dispatcher once both objects exist: EventDispatcher needs this queue and the queue
     * needs its four handlers, so the cycle is broken with one call instead of four field writes.
     */
    public attachDispatcher(dispatcher: SyncEventDispatcher): void {
        this.dispatcher = dispatcher;
    }

    private get syncDispatcher(): SyncEventDispatcher {
        if (this.dispatcher == null) {
            throw new Error("EventQueue: no dispatcher attached; call attachDispatcher() during setup");
        }
        return this.dispatcher;
    }

    public async executeEventHandler(handler: string): Promise<boolean> {
        if (/^\s*$/.exec(handler)) {
            return false;
        }
        const groups = /^\s*(?<funcName>[a-zA-Z_][0-9a-zA-Z_]*)\s*\(\s*\)\s*;?\s*$/.exec(handler)?.groups;
        if (!groups) {
            // Contained to this event like any other handler failure: the page continues, and the
            // bad attribute is recorded rather than aborting the document load.
            this.failEvent(new Error(`invalid event handler attribute ${handler}`), "handler-attribute");
            return false;
        }
        try {
            return await this.interpreter.runEventHandler(groups.funcName);
        } catch (e) {
            this.failEvent(e, "handler");
            return false;
        }
    }

    private readonly timerHandles = new Map<BMLTimerID, Timer>();

    public setInterval(handler: TimerHandler, timeout: number, ...args: any[]): BMLTimerID {
        const handle = window.setInterval(handler, timeout, ...args);
        this.timerHandles.set(handle, {
            handle,
            handler,
            timeout,
        });
        return handle;
    }

    public pauseTimer(timerID: BMLTimerID): boolean {
        const timer = this.timerHandles.get(timerID);
        if (timer == null) {
            return false;
        }
        if (timer.handle != null) {
            window.clearInterval(timer.handle);
            timer.handle = null;
        }
        return true;
    }

    public resumeTimer(timerID: BMLTimerID): boolean {
        const timer = this.timerHandles.get(timerID);
        if (timer == null) {
            return false;
        }
        if (timer.handle == null) {
            timer.handle = window.setInterval(timer.handler, timer.timeout);
        }
        return true;
    }

    public clearInterval(timerID: BMLTimerID): boolean {
        const timer = this.timerHandles.get(timerID);
        if (timer == null) {
            return false;
        }
        if (timer.handle != null) {
            window.clearInterval(timer.handle);
        }
        this.timerHandles.delete(timerID);
        return true;
    }

    private asyncEventQueue: { callback: () => Promise<boolean>, local: boolean }[] = [];
    private syncEventQueue: SyncEvent[] = [];
    private syncEventQueueLockCount = 0;

    public async processEventQueue(): Promise<boolean> {
        if (this.discarded) {
            return false;
        }
        while (this.syncEventQueue.length || this.asyncEventQueue.length) {
            if (this.syncEventQueueLockCount) {
                return false;
            }
            if (this.syncEventQueue.length) {
                let exit = false;
                try {
                    this.lockSyncEventQueue();
                    const event = this.syncEventQueue.shift();
                    if (event?.type === "focus") {
                        if (exit = await this.syncDispatcher.dispatchFocus(event)) {
                            return true;
                        }
                    } else if (event?.type === "blur") {
                        if (exit = await this.syncDispatcher.dispatchBlur(event)) {
                            return true;
                        }
                    } else if (event?.type === "click") {
                        if (exit = await this.syncDispatcher.dispatchClick(event)) {
                            return true;
                        }
                    } else if (event?.type === "change") {
                        if (exit = await this.syncDispatcher.dispatchChange(event)) {
                            return true;
                        }
                    } else {
                        const _: never | undefined = event;
                    }
                } catch (e) {
                    this.failEvent(e, "sync event");
                } finally {
                    if (!exit) {
                        this.unlockSyncEventQueue();
                    }
                }
                continue;
            }
            if (this.asyncEventQueue.length) {
                let exit = false;
                try {
                    this.lockSyncEventQueue();
                    const event = this.asyncEventQueue.shift();
                    if (event != null) {
                        exit = await event.callback();
                        if (exit) {
                            return true;
                        }
                    }
                } catch (e) {
                    this.failEvent(e, "async event");
                } finally {
                    if (!exit) {
                        this.unlockSyncEventQueue();
                    }
                }
            }
        }
        return false;
    }

    /**
     * An event handler that throws is contained to its own event: the queue keeps draining and the
     * promise returned by processEventQueue never rejects, which is what the fire-and-forget call
     * sites assume.
     */
    private failEvent(e: unknown, kind: string): void {
        this.logger.error(`event handler failed`, kind, e);
        // Without this a throw inside a page handler was visible only in the host's log, so
        // getDiagnostics().scripts stayed empty for the failure that actually stopped the page.
        this.onHandlerFailure?.(kind, e);
    }

    public queueSyncEvent(event: SyncEvent) {
        if (!this.discarded) {
            this.syncEventQueue.push(event);
        }
    }

    // タイマーイベントなど文書が変わったら無効になる非同期イベント
    public queueAsyncEvent(callback: () => Promise<boolean>) {
        if (!this.discarded) {
            this.asyncEventQueue.push({ callback, local: true });
        }
    }

    public queueGlobalAsyncEvent(callback: () => Promise<boolean>) {
        this.asyncEventQueue.push({ callback, local: false });
    }

    public lockSyncEventQueue() {
        this.syncEventQueueLockCount++;
    }

    public unlockSyncEventQueue() {
        this.syncEventQueueLockCount--;
        if (this.syncEventQueueLockCount < 0) {
            throw new Error("syncEventQueueLockCount < 0");
        }
    }

    private discarded = false;

    // launchDocumentが呼び出されて読み込まれるまでの間イベントキューは無効になる
    public discard() {
        this.discarded = true;
        this.clear();
    }

    private clear() {
        this.asyncEventQueue = this.asyncEventQueue.filter(x => !x.local);
        this.syncEventQueue.splice(0, this.syncEventQueue.length);
        for (const i of this.timerHandles.keys()) {
            this.clearInterval(i);
        }
    }

    public reset() {
        this.discarded = false;
        this.clear();
        this.syncEventQueueLockCount = 0;
    }
}
