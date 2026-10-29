"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventQueue = exports.EventDispatcher = void 0;
// @ts-ignore
const DOM_1 = require("./interface/DOM");
class EventDispatcher {
    eventQueue;
    bmlDocument;
    resources;
    logger;
    constructor(eventQueue, bmlDocument, resources, logger) {
        this.eventQueue = eventQueue;
        this.bmlDocument = bmlDocument;
        this.resources = resources;
        this.logger = logger;
    }
    setCurrentEvent(a) {
        const { target: _, ...b } = a;
        const c = { target: DOM_1.BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), ...b };
        this.bmlDocument._currentEvent = new DOM_1.BML.BMLEvent(c);
    }
    setCurrentIntrinsicEvent(a) {
        const { target: _, ...b } = a;
        const c = { target: DOM_1.BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), ...b };
        this.bmlDocument._currentEvent = new DOM_1.BML.BMLIntrinsicEvent(c);
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
        const c = { target: DOM_1.BML.htmlElementToBMLHTMLElement(a.target, this.bmlDocument), object: DOM_1.BML.htmlElementToBMLHTMLElement(a.object, this.bmlDocument), ...b };
        this.bmlDocument._currentEvent = new DOM_1.BML.BMLBeventEvent(c);
    }
    // setInterval/グローバルコードのとき (STD-B24 第二分冊 (2/2) 第二編 付属2 表 4-16、STD-B24 第二分冊 (2/2) 第二編 付属4 表 4-12)
    resetCurrentEvent() {
        this.bmlDocument._currentEvent = new DOM_1.BML.BMLEvent({ type: undefined, target: null });
    }
    dispatchModuleLockedEvent(module, isEx, status) {
        this.logger.debug(`${this.logger.prefix}ModuleLocked`, module);
        const moduleLocked = DOM_1.BML.bmlNodeToNode(this.bmlDocument.documentElement).querySelectorAll("beitem[type=\"ModuleLocked\"]");
        const { componentId, moduleId } = this.resources.parseURLEx(module);
        // P1: このロックに対してModuleLockedが実際に送出されたかどうかを、ロック記録に結び付ける
        if (componentId != null && moduleId != null) {
            this.resources.diagnostics.moduleLockedEvent(`/${componentId.toString(16).padStart(2, "0")}/${moduleId.toString(16).padStart(4, "0")}`, isEx, status);
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
        this.logger.debug(`${this.logger.prefix}TimerFired`, status);
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
        this.logger.log(`${this.logger.prefix}DataButtonPressed`);
        const moduleLocked = DOM_1.BML.bmlNodeToNode(this.bmlDocument.documentElement).querySelectorAll("beitem[type=\"DataButtonPressed\"]");
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
        this.logger.log(`${this.logger.prefix}MainAudioStreamChanged`);
        const moduleLocked = DOM_1.BML.bmlNodeToNode(this.bmlDocument.documentElement).querySelectorAll("beitem[type=\"MainAudioStreamChanged\"]");
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
                DOM_1.BML.nodeToBMLNode(event.target, this.bmlDocument).internalLaunchInputApplication();
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
    dispatchFocus = (_event) => Promise.resolve(false);
    dispatchBlur = (_event) => Promise.resolve(false);
    dispatchClick = (_event) => Promise.resolve(false);
    dispatchChange = (_event) => Promise.resolve(false);
    constructor(interpreter, logger) {
        this.interpreter = interpreter;
        this.logger = logger;
    }
    async executeEventHandler(handler) {
        if (/^\s*$/.exec(handler)) {
            return false;
        }
        const groups = /^\s*(?<funcName>[a-zA-Z_][0-9a-zA-Z_]*)\s*\(\s*\)\s*;?\s*$/.exec(handler)?.groups;
        if (!groups) {
            throw new Error("invalid event handler attribute " + handler);
        }
        this.logger.debug(`${this.logger.prefix}EXECUTE`, handler);
        const result = await this.interpreter.runEventHandler(groups.funcName);
        this.logger.debug(`${this.logger.prefix}END`, handler);
        return result;
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
                        if (exit = await this.dispatchFocus(event)) {
                            return true;
                        }
                    }
                    else if (event?.type === "blur") {
                        if (exit = await this.dispatchBlur(event)) {
                            return true;
                        }
                    }
                    else if (event?.type === "click") {
                        if (exit = await this.dispatchClick(event)) {
                            return true;
                        }
                    }
                    else if (event?.type === "change") {
                        if (exit = await this.dispatchChange(event)) {
                            return true;
                        }
                    }
                    else {
                        const _ = event;
                    }
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
                finally {
                    if (!exit) {
                        this.unlockSyncEventQueue();
                    }
                }
            }
        }
        return false;
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