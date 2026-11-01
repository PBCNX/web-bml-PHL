"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventQueue = exports.EventDispatcher = exports.MODULE_LOCKED_BURST_LIMIT = void 0;
// BML is a runtime namespace here (nodeToBMLNode), so this edge stays a value import.
const bml_dom_1 = require("./dom/bml_dom");
const format_1 = require("./format");
/** 2.4.5: how many identical ModuleLocked events one module+status may produce per second. */
exports.MODULE_LOCKED_BURST_LIMIT = 16;
class EventDispatcher {
    eventQueue;
    bmlDocument;
    resources;
    logger;
    /** 2.4.5: ModuleLocked bursts, keyed by module and status. */
    moduleLockedStorm = new Map();
    constructor(eventQueue, bmlDocument, resources, logger) {
        this.eventQueue = eventQueue;
        this.bmlDocument = bmlDocument;
        this.resources = resources;
        this.logger = logger;
    }
    setCurrentEvent(a) {
        const { target: _, ...b } = a;
        const c = { target: bml_dom_1.BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), ...b };
        this.bmlDocument._currentEvent = new bml_dom_1.BML.BMLEvent(c);
    }
    setCurrentIntrinsicEvent(a) {
        const { target: _, ...b } = a;
        const c = { target: bml_dom_1.BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), ...b };
        this.bmlDocument._currentEvent = new bml_dom_1.BML.BMLIntrinsicEvent(c);
    }
    setCurrentBeventEvent(ev) {
        const a = {
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
        const c = { target: bml_dom_1.BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), object: bml_dom_1.BML.htmlElementToBMLHTMLElement(a.object, this.bmlDocument), ...b };
        this.bmlDocument._currentEvent = new bml_dom_1.BML.BMLBeventEvent(c);
    }
    // setInterval/グローバルコードのとき (STD-B24 第二分冊 (2/2) 第二編 付属2 表 4-16、STD-B24 第二分冊 (2/2) 第二編 付属4 表 4-12)
    resetCurrentEvent() {
        this.bmlDocument._currentEvent = new bml_dom_1.BML.BMLEvent({ type: undefined, target: null });
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
    allowedModuleLockedEvent(module, status, now) {
        const key = `${module}:${status}`;
        const entry = this.moduleLockedStorm.get(key);
        if (entry == null || now - entry.firstAt > 1000) {
            this.moduleLockedStorm.set(key, { count: 1, firstAt: now });
            return true;
        }
        entry.count++;
        return entry.count <= exports.MODULE_LOCKED_BURST_LIMIT;
    }
    dispatchModuleLockedEvent(module, isEx, status) {
        if (!this.allowedModuleLockedEvent(module, status, performance.now())) {
            // Log once per second at most: the page loops, the log must not.
            const key = `${module}:${status}`;
            const entry = this.moduleLockedStorm.get(key);
            if (entry != null && !entry.reported) {
                entry.reported = true;
                this.logger.error(`ModuleLocked burst`, module, status, `more than ${exports.MODULE_LOCKED_BURST_LIMIT} in one second; suppressed`);
            }
            return;
        }
        this.logger.debug(`ModuleLocked`, module);
        const moduleLocked = bml_dom_1.BML.bmlNodeToNode(this.bmlDocument.documentElement).querySelectorAll("beitem[type=\"ModuleLocked\"]");
        const { componentId, moduleId } = this.resources.parseURLEx(module);
        // P1: このロックに対してModuleLockedが実際に送出されたかどうかを、ロック記録に結び付ける
        if (componentId != null && moduleId != null) {
            this.resources.diagnostics.moduleLockedEvent((0, format_1.formatModuleRef)(componentId, moduleId), isEx, status);
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
                            target: beitem,
                            status,
                            moduleRef: module,
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
    }
    dispatchTimerFiredEvent(status, beitem) {
        this.logger.debug(`TimerFired`, status);
        if (beitem.getAttribute("subscribe") !== "subscribe") {
            return;
        }
        const onoccur = beitem.getAttribute("onoccur");
        if (onoccur) {
            this.eventQueue.queueAsyncEvent(async () => {
                this.setCurrentBeventEvent({
                    type: "TimerFired",
                    target: beitem,
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
    dispatchDataButtonPressedEvent() {
        this.logger.log(`DataButtonPressed`);
        const moduleLocked = bml_dom_1.BML.bmlNodeToNode(this.bmlDocument.documentElement).querySelectorAll("beitem[type=\"DataButtonPressed\"]");
        for (const beitem of Array.from(moduleLocked)) {
            if (beitem.getAttribute("subscribe") !== "subscribe") {
                continue;
            }
            const onoccur = beitem.getAttribute("onoccur");
            if (onoccur) {
                this.eventQueue.queueAsyncEvent(async () => {
                    this.setCurrentBeventEvent({
                        type: "DataButtonPressed",
                        target: beitem,
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
    dispatchMainAudioStreamChangedEvent(prevComponentId, prevChannelId, componentId, channelId) {
        this.logger.log(`MainAudioStreamChanged`);
        const moduleLocked = bml_dom_1.BML.bmlNodeToNode(this.bmlDocument.documentElement).querySelectorAll("beitem[type=\"MainAudioStreamChanged\"]");
        for (const beitem of Array.from(moduleLocked)) {
            if (beitem.getAttribute("subscribe") !== "subscribe") {
                continue;
            }
            const onoccur = beitem.getAttribute("onoccur");
            if (!onoccur) {
                continue;
            }
            const es_ref = beitem.getAttribute("es_ref");
            let selected;
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
            }
            else {
                // 省略した場合商品企画 (TR-14)
                selected = true;
            }
            const prefix = (this.resources.isInternetContent ? "arib://-1.-1.-1/" /* ? */ : "/");
            const component = componentId.toString(16).padStart(2, "0");
            let esRef;
            if (channelId != null) {
                esRef = prefix + component + ";" + channelId;
            }
            else {
                esRef = prefix + component;
            }
            this.eventQueue.queueAsyncEvent(async () => {
                this.setCurrentBeventEvent({
                    type: "MainAudioStreamChanged",
                    target: beitem,
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
    async dispatchFocus(event) {
        this.setCurrentEvent({
            type: "focus",
            target: event.target,
        });
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
                bml_dom_1.BML.nodeToBMLNode(event.target, this.bmlDocument).internalLaunchInputApplication();
            }
        }
        return false;
    }
    async dispatchBlur(event) {
        this.setCurrentEvent({
            type: "blur",
            target: event.target,
        });
        const handler = event.target.getAttribute("onblur");
        if (handler) {
            if (await this.eventQueue.executeEventHandler(handler)) {
                return true;
            }
        }
        this.resetCurrentEvent();
        return false;
    }
    async dispatchClick(event) {
        this.setCurrentEvent({
            type: "click",
            target: event.target,
        });
        const handler = event.target.getAttribute("onclick");
        if (handler) {
            if (await this.eventQueue.executeEventHandler(handler)) {
                return true;
            }
        }
        this.resetCurrentEvent();
        return false;
    }
    async dispatchChange(event) {
        this.setCurrentEvent({
            type: "change",
            target: event.target,
        });
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
exports.EventDispatcher = EventDispatcher;
class EventQueue {
    interpreter;
    logger;
    dispatcher = null;
    /** Reported to the owner so a handler failure reaches getDiagnostics(), not only the log. */
    onHandlerFailure;
    constructor(interpreter, logger) {
        this.interpreter = interpreter;
        this.logger = logger;
    }
    /**
     * Wires the dispatcher once both objects exist: EventDispatcher needs this queue and the queue
     * needs its four handlers, so the cycle is broken with one call instead of four field writes.
     */
    attachDispatcher(dispatcher) {
        this.dispatcher = dispatcher;
    }
    get syncDispatcher() {
        if (this.dispatcher == null) {
            throw new Error("EventQueue: no dispatcher attached; call attachDispatcher() during setup");
        }
        return this.dispatcher;
    }
    async executeEventHandler(handler) {
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
        }
        catch (e) {
            this.failEvent(e, "handler");
            return false;
        }
    }
    timerHandles = new Map();
    setInterval(handler, timeout, ...args) {
        const handle = window.setInterval(handler, timeout, ...args);
        this.timerHandles.set(handle, {
            handle,
            handler,
            timeout,
        });
        return handle;
    }
    pauseTimer(timerID) {
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
    resumeTimer(timerID) {
        const timer = this.timerHandles.get(timerID);
        if (timer == null) {
            return false;
        }
        if (timer.handle == null) {
            timer.handle = window.setInterval(timer.handler, timer.timeout);
        }
        return true;
    }
    clearInterval(timerID) {
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
    asyncEventQueue = [];
    syncEventQueue = [];
    syncEventQueueLockCount = 0;
    async processEventQueue() {
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
                    }
                    else if (event?.type === "blur") {
                        if (exit = await this.syncDispatcher.dispatchBlur(event)) {
                            return true;
                        }
                    }
                    else if (event?.type === "click") {
                        if (exit = await this.syncDispatcher.dispatchClick(event)) {
                            return true;
                        }
                    }
                    else if (event?.type === "change") {
                        if (exit = await this.syncDispatcher.dispatchChange(event)) {
                            return true;
                        }
                    }
                    else {
                        const _ = event;
                    }
                }
                catch (e) {
                    this.failEvent(e, "sync event");
                }
                finally {
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
                }
                catch (e) {
                    this.failEvent(e, "async event");
                }
                finally {
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
    failEvent(e, kind) {
        this.logger.error(`event handler failed`, kind, e);
        // Without this a throw inside a page handler was visible only in the host's log, so
        // getDiagnostics().scripts stayed empty for the failure that actually stopped the page.
        this.onHandlerFailure?.(kind, e);
    }
    queueSyncEvent(event) {
        if (!this.discarded) {
            this.syncEventQueue.push(event);
        }
    }
    // タイマーイベントなど文書が変わったら無効になる非同期イベント
    queueAsyncEvent(callback) {
        if (!this.discarded) {
            this.asyncEventQueue.push({ callback, local: true });
        }
    }
    queueGlobalAsyncEvent(callback) {
        this.asyncEventQueue.push({ callback, local: false });
    }
    lockSyncEventQueue() {
        this.syncEventQueueLockCount++;
    }
    unlockSyncEventQueue() {
        this.syncEventQueueLockCount--;
        if (this.syncEventQueueLockCount < 0) {
            throw new Error("syncEventQueueLockCount < 0");
        }
    }
    discarded = false;
    // launchDocumentが呼び出されて読み込まれるまでの間イベントキューは無効になる
    discard() {
        this.discarded = true;
        this.clear();
    }
    clear() {
        this.asyncEventQueue = this.asyncEventQueue.filter(x => !x.local);
        this.syncEventQueue.splice(0, this.syncEventQueue.length);
        for (const i of this.timerHandles.keys()) {
            this.clearInterval(i);
        }
    }
    reset() {
        this.discarded = false;
        this.clear();
        this.syncEventQueueLockCount = 0;
    }
}
exports.EventQueue = EventQueue;
//# sourceMappingURL=event_queue.js.map