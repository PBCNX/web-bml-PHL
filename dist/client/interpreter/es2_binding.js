"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineBuiltinBinding = defineBuiltinBinding;
exports.defineBrowserBinding = defineBrowserBinding;
exports.defineBinaryTableBinding = defineBinaryTableBinding;
const es2_1 = require("../../es2");
const BT = __importStar(require("../binary_table"));
const resource_1 = require("../resource");
const bmlDate = __importStar(require("../date"));
const bmlNumber = __importStar(require("../number"));
const bmlString = __importStar(require("../string"));
const text_1 = require("../text");
const arib_text_1 = require("../arib_text");
const LAUNCH_DOCUMENT_CALLED = { type: "launchDocumentCalled" };
function wrapArray(ctx, array) {
    if (!Array.isArray(array)) {
        return array;
    }
    const a = [];
    for (const i of array) {
        if (Array.isArray(i)) {
            a.push(wrapArray(ctx, i));
        }
        else {
            a.push(i);
        }
    }
    return (0, es2_1.newArray)(ctx, a);
}
function wrapDate(ctx, date) {
    if (date instanceof Date) {
        return (0, es2_1.newDate)(ctx, date);
    }
    else {
        return date;
    }
}
function defineBuiltinBinding(context, resources) {
    context.realm.intrinsics.Number.properties.set("MAX_VALUE", {
        readOnly: true,
        dontEnum: true,
        dontDelete: true,
        value: bmlNumber.MAX_VALUE,
    });
    context.realm.intrinsics.Number.properties.set("MIN_VALUE", {
        readOnly: true,
        dontEnum: true,
        dontDelete: true,
        value: bmlNumber.MIN_VALUE,
    });
    context.realm.intrinsics.String.properties.set("fromCharCode", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* stringFromCharCode(ctx, _self, args, caller) {
            const codes = [];
            for (const arg of args) {
                codes.push(yield* (0, es2_1.toNumber)(ctx, arg, caller));
            }
            if (resources.profile === resource_1.Profile.TrProfileC) {
                return bmlString.shiftJISFromCharCode(...codes);
            }
            return bmlString.eucJPFromCharCode(...codes);
        }, 1, "fromCharCode"),
    });
    // 比較で使うcharCodeAtの定義
    if (resources.profile === resource_1.Profile.TrProfileC) {
        context.realm.intrinsics.StringPrototypeCharCodeAt = function shiftJISCharCodeAt(str, pos) {
            return bmlString.shiftJISCharCodeAt.call(str, pos);
        };
    }
    else {
        context.realm.intrinsics.StringPrototypeCharCodeAt = function eucJPCharCodeAt(str, pos) {
            return bmlString.eucJPCharCodeAt.call(str, pos);
        };
    }
    context.realm.intrinsics.StringPrototype.properties.set("charCodeAt", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* stringCharCodeAt(ctx, self, args, caller) {
            const str = yield* (0, es2_1.toString)(ctx, self, caller);
            const pos = yield* (0, es2_1.toNumber)(ctx, args[0], caller);
            if (resources.profile === resource_1.Profile.TrProfileC) {
                return bmlString.shiftJISCharCodeAt.call(str, pos);
            }
            return bmlString.eucJPCharCodeAt.call(str, pos);
        }, 1, "charCodeAt"),
    });
    const date = (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* date(_ctx, _self, _args) {
        if (resources.currentTimeUnixMillis != null) {
            return bmlDate.toString.call(new Date(resources.currentTimeUnixMillis));
        }
        else {
            return bmlDate.toString.call(new Date());
        }
    }, 7, "Date");
    date.internalProperties.construct = function* dateConstructor(ctx, args, caller) {
        args.length = Math.min(7, args.length);
        let value;
        if (args.length === 1) {
            const valuePrimitive = yield* (0, es2_1.toPrimitive)(ctx, args[0], "default", caller);
            if (typeof valuePrimitive === "string") {
                value = new Date(valuePrimitive);
            }
            else {
                value = new Date(yield* (0, es2_1.toNumber)(ctx, valuePrimitive, caller));
            }
        }
        else if (args.length === 0) {
            if (resources.currentTimeUnixMillis != null) {
                value = new Date(resources.currentTimeUnixMillis);
            }
            else {
                value = new Date();
            }
        }
        else {
            let numbers = [];
            for (const arg of args) {
                numbers.push(yield* (0, es2_1.toNumber)(ctx, arg, caller));
            }
            value = new Date(...numbers);
        }
        return (0, es2_1.newDate)(ctx, value);
    };
    const datePrototype = (0, es2_1.newObject)(context.realm.intrinsics.ObjectPrototype);
    datePrototype.properties.set("constructor", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: date,
    });
    for (const f of [
        "valueOf",
        "getTime",
        "getFullYear",
        "getUTCFullYear",
        "getMonth",
        "getUTCMonth",
        "getDate",
        "getUTCDate",
        "getDay",
        "getUTCDay",
        "getHours",
        "getUTCHours",
        "getMinutes",
        "getUTCMinutes",
        "getSeconds",
        "getUTCSeconds",
        "getMilliseconds",
        "getUTCMilliseconds",
        "getTimezoneOffset",
    ]) {
        datePrototype.properties.set(f, {
            readOnly: false,
            dontEnum: true,
            dontDelete: false,
            value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* datePrototypeWrapper(ctx, self, _args, caller) {
                const value = (0, es2_1.getDateObjectValue)(self);
                if (value == null) {
                    throw new es2_1.InterpreterTypeError(`Date.prototype.${f}: this must be Date object`, ctx, caller);
                }
                return new Date(value)[f]();
            }, 0, f),
        });
    }
    for (const [f, length] of [
        ["setTime", 1],
        ["setMilliseconds", 1],
        ["setUTCMilliseconds", 1],
        ["setSeconds", 2],
        ["setUTCSeconds", 2],
        ["setMinutes", 3],
        ["setUTCMinutes", 3],
        ["setHours", 4],
        ["setUTCHours", 4],
        ["setDate", 1],
        ["setUTCDate", 1],
        ["setMonth", 2],
        ["setUTCMonth", 2],
        ["setFullYear", 3],
        ["setUTCFullYear", 3],
    ]) {
        datePrototype.properties.set(f, {
            readOnly: false,
            dontEnum: true,
            dontDelete: false,
            value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* datePrototypeWrapper(ctx, self, args, caller) {
                const value = (0, es2_1.getDateObjectValue)(self);
                if (value == null || !(0, es2_1.isObject)(self)) {
                    throw new es2_1.InterpreterTypeError(`Date.prototype.${f}: this must be Date object`, ctx, caller);
                }
                args.length = Math.min(args.length, length);
                let numbers = [];
                for (const arg of args) {
                    numbers.push(yield* (0, es2_1.toNumber)(ctx, arg, caller));
                }
                self.internalProperties.value = new Date(value)[f](...numbers);
                return self.internalProperties.value;
            }, length, f),
        });
    }
    date.properties.set("prototype", {
        readOnly: true,
        dontEnum: true,
        dontDelete: true,
        value: datePrototype,
    });
    datePrototype.properties.set("toString", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* dateToString(ctx, self, _args, caller) {
            const value = (0, es2_1.getDateObjectValue)(self);
            if (value == null) {
                throw new es2_1.InterpreterTypeError("Date.prototype.toString: this must be Date object", ctx, caller);
            }
            return bmlDate.toString.call(new Date(value));
        }, 0, "toString"),
    });
    datePrototype.properties.set("toLocaleString", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* dateToString(ctx, self, _args, caller) {
            const value = (0, es2_1.getDateObjectValue)(self);
            if (value == null) {
                throw new es2_1.InterpreterTypeError("Date.prototype.toLocaleString: this must be Date object", ctx, caller);
            }
            return bmlDate.toString.call(new Date(value));
        }, 0, "toLocaleString"),
    });
    datePrototype.properties.set("toUTCString", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* dateToString(ctx, self, _args, caller) {
            const value = (0, es2_1.getDateObjectValue)(self);
            if (value == null) {
                throw new es2_1.InterpreterTypeError("Date.prototype.toUTCString: this must be Date object", ctx, caller);
            }
            return bmlDate.toUTCString.call(new Date(value));
        }, 0, "toUTCString"),
    });
    context.realm.intrinsics.Date = date;
    context.realm.intrinsics.DatePrototype = datePrototype;
    context.realm.globalObject.properties.set("Date", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: date,
    });
    context.realm.globalObject.properties.delete("Infinity");
    context.realm.globalObject.properties.delete("eval");
    context.realm.globalObject.properties.delete("parseFloat");
    context.realm.globalObject.properties.delete("escape");
    context.realm.globalObject.properties.delete("unescape");
    context.realm.globalObject.properties.delete("isFinite");
    context.realm.intrinsics.Number.properties.delete("NEGATIVE_INFINITY");
    context.realm.intrinsics.Number.properties.delete("POSITIVE_INFINITY");
    context.realm.globalObject.properties.delete("Math");
}
function defineBrowserBinding(context, resources, browserAPI, content, epg, logger) {
    const browser = (0, es2_1.newObject)(context.realm.intrinsics.ObjectPrototype);
    browser.internalProperties.class = "hostobject";
    context.realm.globalObject.properties.set("browser", {
        readOnly: false,
        dontEnum: false,
        dontDelete: false,
        value: browser,
    });
    browser.internalProperties.hostObjectValue = browserAPI;
    const ureg = (0, es2_1.newObject)(context.realm.intrinsics.ObjectPrototype);
    ureg.internalProperties.hostObjectValue = browserAPI;
    ureg.internalProperties.class = "hostobject";
    for (let i = 0; i < browserAPI.browser.Ureg.length; i++) {
        ureg.properties.set(String(i), {
            readOnly: false,
            dontEnum: false,
            dontDelete: true,
            value: undefined,
        });
    }
    ureg.internalProperties.get = function* browser$Ureg$get(_ctx, _self, propertyName, _caller) {
        return browserAPI.getUreg(Number(propertyName));
    };
    ureg.internalProperties.put = function* browser$Ureg$put(ctx, _self, propertyName, value, caller) {
        browserAPI.setUreg(Number(propertyName), yield* (0, es2_1.toString)(ctx, value, caller));
    };
    const greg = (0, es2_1.newObject)(context.realm.intrinsics.ObjectPrototype);
    greg.internalProperties.hostObjectValue = browserAPI;
    greg.internalProperties.class = "hostobject";
    for (let i = 0; i < browserAPI.browser.Greg.length; i++) {
        greg.properties.set(String(i), {
            readOnly: false,
            dontEnum: false,
            dontDelete: true,
            value: undefined,
        });
    }
    greg.internalProperties.get = function* browser$Greg$get(_ctx, _self, propertyName, _caller) {
        return browserAPI.getGreg(Number(propertyName));
    };
    greg.internalProperties.put = function* browser$Greg$put(ctx, _self, propertyName, value, caller) {
        browserAPI.setGreg(Number(propertyName), yield* (0, es2_1.toString)(ctx, value, caller));
    };
    const desc = {
        readOnly: true,
        dontEnum: true,
        dontDelete: true
    };
    browser.properties.set("Ureg", {
        ...desc,
        value: ureg,
    });
    browser.properties.set("Greg", {
        ...desc,
        value: greg,
    });
    function* launchDocument(documentName, transitionStyle) {
        logger.log(`${logger.prefix}launchDocument`, documentName, transitionStyle);
        if (documentName.startsWith("#")) {
            // Cプロファイル TR-B14 第三分冊
            // 8.2.3.4 #fragment運用における受信機動作およびコンテンツガイドライン
            // "#top"の場合リロードされないことが望ましい
            // "startup.bml#top"の場合リロードが行われることが望ましい
            content.focusFragment(documentName);
            return 0;
        }
        const r = content.launchDocument(String(documentName));
        yield LAUNCH_DOCUMENT_CALLED;
        return r;
    }
    function* reloadActiveDocument() {
        logger.log(`${logger.prefix}reloadActiveDocument`);
        const r = content.launchDocument(browserAPI.browser.getActiveDocument());
        yield LAUNCH_DOCUMENT_CALLED;
        return r;
    }
    function* quitDocument() {
        logger.log(`${logger.prefix}quitDocument`);
        content.quitDocument().catch((e) => logger.error(`quitDocument failed`, e));
        yield LAUNCH_DOCUMENT_CALLED;
        return NaN;
    }
    function* X_DPA_launchDocWithLink(documentName, transitionStyle) {
        logger.log(`${logger.prefix}%cX_DPA_launchDocWithLink`, "font-size: 1.5em", documentName);
        if (resources.profile !== resource_1.Profile.TrProfileC) {
            yield LAUNCH_DOCUMENT_CALLED;
            return NaN;
        }
        // 絶対 URI を使用すること (TR-B14 第三分冊 8.3.10.2)
        // http: / https: のいずれも可 (同 8.3.10.3)
        if (!documentName.startsWith("http://") && !documentName.startsWith("https://")) {
            yield LAUNCH_DOCUMENT_CALLED;
            return NaN;
        }
        if (!resources.isInternetContent) {
            // 放送受信状態で使われた場合失敗動作となる
            // エラーメッセージを表示すべき (8.3.11.4)
            content.quitDocument().catch((e) => logger.error(`quitDocument failed`, e));
            yield LAUNCH_DOCUMENT_CALLED;
            return NaN;
        }
        const r = content.launchDocument(documentName, { withLink: true });
        yield LAUNCH_DOCUMENT_CALLED;
        return r;
    }
    function* epgTune(service_ref) {
        logger.log(`${logger.prefix}%cepgTune`, "font-size: 1.5em", service_ref);
        const { originalNetworkId, transportStreamId, serviceId } = resources.parseServiceReference(service_ref);
        if (originalNetworkId == null || transportStreamId == null || serviceId == null) {
            yield LAUNCH_DOCUMENT_CALLED;
            return NaN;
        }
        else {
            const r = epg.tune?.(originalNetworkId, transportStreamId, serviceId);
            yield LAUNCH_DOCUMENT_CALLED;
            return r;
        }
    }
    browser.properties.set("epgGetEventStartTime", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgGetEventStartTime(ctx, _self, args, caller) {
            return wrapDate(ctx, browserAPI.browser.epgGetEventStartTime(yield* (0, es2_1.toString)(ctx, args[0], caller)));
        }, 1, "epgGetEventStartTime"),
    });
    browser.properties.set("epgGetEventDuration", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgGetEventDuration(ctx, _self, args, caller) {
            return browserAPI.browser.epgGetEventDuration(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "epgGetEventDuration"),
    });
    browser.properties.set("epgTuneToComponent", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgTuneToComponent(ctx, _self, args, caller) {
            return browserAPI.browser.epgTuneToComponent(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "epgTuneToComponent"),
    });
    browser.properties.set("epgIsReserved", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgIsReserved(ctx, _self, args, caller) {
            return browserAPI.browser.epgIsReserved(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "epgIsReserved"),
    });
    browser.properties.set("epgReserve", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgReserve(ctx, _self, args, caller) {
            const startTime = (0, es2_1.getDateObjectValue)(args[1]);
            return browserAPI.browser.epgReserve(yield* (0, es2_1.toString)(ctx, args[0], caller), startTime == null ? startTime : new Date(startTime));
        }, 2, "epgReserve"),
    });
    browser.properties.set("epgCancelReservation", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgCancelReservation(ctx, _self, args, caller) {
            return browserAPI.browser.epgCancelReservation(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "epgCancelReservation"),
    });
    browser.properties.set("epgRecIsReserved", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgRecIsReserved(ctx, _self, args, caller) {
            const startTime = (0, es2_1.getDateObjectValue)(args[1]);
            return browserAPI.browser.epgRecIsReserved(yield* (0, es2_1.toString)(ctx, args[0], caller), startTime == null ? startTime : new Date(startTime));
        }, 2, "epgRecIsReserved"),
    });
    browser.properties.set("epgRecReserve", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgRecReserve(ctx, _self, args, caller) {
            const startTime = (0, es2_1.getDateObjectValue)(args[1]);
            return browserAPI.browser.epgRecReserve(yield* (0, es2_1.toString)(ctx, args[0], caller), startTime == null ? startTime : new Date(startTime));
        }, 2, "epgRecReserve"),
    });
    browser.properties.set("epgRecCancelReservation", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgRecCancelReservation(ctx, _self, args, caller) {
            return browserAPI.browser.epgRecCancelReservation(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "epgRecCancelReservation"),
    });
    browser.properties.set("setCCDisplayStatus", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$setCCDisplayStatus(ctx, _self, args, caller) {
            return browserAPI.browser.setCCDisplayStatus(yield* (0, es2_1.toNumber)(ctx, args[0], caller), (0, es2_1.toBoolean)(args[1]));
        }, 2, "setCCDisplayStatus"),
    });
    browser.properties.set("getCCDisplayStatus", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getCCDisplayStatus(ctx, _self, args, caller) {
            return browserAPI.browser.getCCDisplayStatus(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "getCCDisplayStatus"),
    });
    browser.properties.set("getCCLanguageStatus", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getCCLanguageStatus(ctx, _self, args, caller) {
            return browserAPI.browser.getCCLanguageStatus(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "getCCLanguageStatus"),
    });
    browser.properties.set("writeBookmarkArray", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$writeBookmarkArray(ctx, _self, args, caller) {
            const filename = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const title = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const dstURI = yield* (0, es2_1.toString)(ctx, args[2], caller);
            const expire_str = yield* (0, es2_1.toString)(ctx, args[3], caller);
            const bmType = yield* (0, es2_1.toString)(ctx, args[4], caller);
            const linkMedia = yield* (0, es2_1.toString)(ctx, args[5], caller);
            const usageFlag = yield* (0, es2_1.toString)(ctx, args[6], caller);
            const extendedStructure = args[7] == null ? undefined : yield* (0, es2_1.toString)(ctx, args[7], caller);
            let a;
            if (extendedStructure != null) {
                const fields = BT.parseBinaryStructure(extendedStructure);
                if (fields == null) {
                    return NaN;
                }
                if (!(0, es2_1.isObject)(args[8])) {
                    return NaN;
                }
                a = [];
                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];
                    switch (field.type) {
                        case BT.BinaryTableType.Boolean:
                            a[i] = (0, es2_1.toBoolean)(yield* (0, es2_1.getProperty)(ctx, args[8], String(i), caller));
                            break;
                        case BT.BinaryTableType.UnsignedInteger:
                        case BT.BinaryTableType.Integer:
                            a[i] = yield* (0, es2_1.toNumber)(ctx, yield* (0, es2_1.getProperty)(ctx, args[8], String(i), caller), caller);
                            break;
                        case BT.BinaryTableType.String:
                            a[i] = yield* (0, es2_1.toString)(ctx, yield* (0, es2_1.getProperty)(ctx, args[8], String(i), caller), caller);
                            break;
                    }
                }
            }
            return browserAPI.browser.writeBookmarkArray(filename, title, dstURI, expire_str, bmType, linkMedia, usageFlag, extendedStructure, a);
        }, 9, "writeBookmarkArray"),
    });
    browser.properties.set("readBookmarkArray", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$readBookmarkArray(ctx, _self, args, caller) {
            return wrapArray(ctx, browserAPI.browser.readBookmarkArray(yield* (0, es2_1.toString)(ctx, args[0], caller), args[1] == null ? undefined : yield* (0, es2_1.toString)(ctx, args[1], caller), args[2] == null ? undefined : yield* (0, es2_1.toString)(ctx, args[2], caller)));
        }, 3, "readBookmarkArray"),
    });
    browser.properties.set("deleteBookmark", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$deleteBookmark(ctx, _self, args, caller) {
            return browserAPI.browser.deleteBookmark(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "deleteBookmark"),
    });
    browser.properties.set("lockBookmark", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$lockBookmark(ctx, _self, args, caller) {
            return browserAPI.browser.lockBookmark(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "lockBookmark"),
    });
    browser.properties.set("unlockBookmark", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$unlockBookmark(ctx, _self, args, caller) {
            return browserAPI.browser.unlockBookmark(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "unlockBookmark"),
    });
    browser.properties.set("getBookmarkInfo", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getBookmarkInfo(ctx, _self, args, caller) {
            return wrapArray(ctx, browserAPI.browser.getBookmarkInfo());
        }, 0, "getBookmarkInfo"),
    });
    browser.properties.set("getBookmarkInfo2", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getBookmarkInfo(ctx, _self, args, caller) {
            return wrapArray(ctx, browserAPI.browser.getBookmarkInfo2(yield* (0, es2_1.toString)(ctx, args[0], caller)));
        }, 1, "getBookmarkInfo2"),
    });
    browser.properties.set("setCurrentDateMode", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$setCurrentDateMode(ctx, _self, args, caller) {
            return browserAPI.browser.setCurrentDateMode(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "setCurrentDateMode"),
    });
    browser.properties.set("getProgramRelativeTime", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getProgramRelativeTime(ctx, _self, args, caller) {
            return browserAPI.browser.getProgramRelativeTime();
        }, 0, "getProgramRelativeTime"),
    });
    browser.properties.set("isBeingBroadcast", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$isBeingBroadcast(ctx, _self, args, caller) {
            return browserAPI.browser.isBeingBroadcast(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "isBeingBroadcast"),
    });
    browser.properties.set("subDate", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$subDate(ctx, _self, args, caller) {
            const target = (0, es2_1.getDateObjectValue)(args[0]);
            if (target == null) {
                return NaN;
            }
            const base = (0, es2_1.getDateObjectValue)(args[1]);
            if (base == null) {
                return NaN;
            }
            return browserAPI.browser.subDate(new Date(target), new Date(base), yield* (0, es2_1.toNumber)(ctx, args[2], caller));
        }, 3, "subDate"),
    });
    browser.properties.set("addDate", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$addDate(ctx, _self, args, caller) {
            const target = (0, es2_1.getDateObjectValue)(args[0]);
            if (target == null) {
                return NaN;
            }
            return wrapDate(ctx, browserAPI.browser.addDate(new Date(target), yield* (0, es2_1.toNumber)(ctx, args[1], caller), yield* (0, es2_1.toNumber)(ctx, args[2], caller)));
        }, 3, "addDate"),
    });
    browser.properties.set("formatNumber", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$formatNumber(ctx, _self, args, caller) {
            return browserAPI.browser.formatNumber(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "formatNumber"),
    });
    browser.properties.set("unlockModuleOnMemory", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$unlockModuleOnMemory(ctx, _self, args, caller) {
            return browserAPI.browser.unlockModuleOnMemory(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "unlockModuleOnMemory"),
    });
    browser.properties.set("setCachePriority", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$setCachePriority(ctx, _self, args, caller) {
            return browserAPI.browser.setCachePriority(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller));
        }, 2, "setCachePriority"),
    });
    browser.properties.set("unlockModuleOnMemoryEx", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$unlockModuleOnMemoryEx(ctx, _self, args, caller) {
            return browserAPI.browser.unlockModuleOnMemoryEx(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "unlockModuleOnMemoryEx"),
    });
    browser.properties.set("unlockAllModulesOnMemory", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$unlockAllModulesOnMemory(ctx, _self, args, caller) {
            return browserAPI.browser.unlockAllModulesOnMemory();
        }, 0, "unlockAllModulesOnMemory"),
    });
    browser.properties.set("lockModuleOnMemory", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$lockModuleOnMemory(ctx, _self, args, caller) {
            return browserAPI.browser.lockModuleOnMemory(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "lockModuleOnMemory"),
    });
    browser.properties.set("lockModuleOnMemoryEx", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$lockModuleOnMemoryEx(ctx, _self, args, caller) {
            return browserAPI.browser.lockModuleOnMemoryEx(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "lockModuleOnMemoryEx"),
    });
    browser.properties.set("lockScreen", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$lockScreen(ctx, _self, args, caller) {
            return browserAPI.browser.lockScreen();
        }, 0, "lockScreen"),
    });
    browser.properties.set("unlockScreen", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$unlockScreen(ctx, _self, args, caller) {
            return browserAPI.browser.unlockScreen();
        }, 0, "unlockScreen"),
    });
    browser.properties.set("getBrowserSupport", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getBrowserSupport(ctx, _self, args, caller) {
            const sProvider = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const functionname = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const additionalinfoList = args.slice(2);
            const additionalinfoListString = [];
            for (const a of additionalinfoList) {
                additionalinfoListString.push(yield* (0, es2_1.toString)(ctx, a, caller));
            }
            return browserAPI.browser.getBrowserSupport(sProvider, functionname, ...additionalinfoListString);
        }, 2, "getBrowserSupport"),
    });
    browser.properties.set("getBrowserStatus", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getBrowserStatus(ctx, _self, args, caller) {
            return browserAPI.browser.getBrowserStatus(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toString)(ctx, args[1], caller), yield* (0, es2_1.toString)(ctx, args[2], caller));
        }, 3, "getBrowserStatus"),
    });
    browser.properties.set("launchDocument", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$launchDocument(ctx, _self, args, caller) {
            const documentName = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const transitionStyle = args[1] === undefined ? args[1] : yield* (0, es2_1.toString)(ctx, args[1], caller);
            return yield* launchDocument(documentName, transitionStyle);
        }, 1, "launchDocument"),
    });
    browser.properties.set("quitDocument", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$quitDocument() {
            return yield* quitDocument();
        }, 0, "quitDocument"),
    });
    browser.properties.set("reloadActiveDocument", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$reloadActiveDocument(ctx, _self, args, caller) {
            return yield* reloadActiveDocument();
        }, 0, "reloadActiveDocument"),
    });
    browser.properties.set("launchExApp", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$launchExApp(ctx, _self, args, caller) {
            const uriname = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const MIME_type = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const Ex_info = [];
            for (let a of args.slice(2)) {
                Ex_info.push(yield* (0, es2_1.toString)(ctx, a, caller));
            }
            return browserAPI.browser.launchExApp(uriname, MIME_type, ...Ex_info);
        }, 2, "launchExApp"),
    });
    browser.properties.set("getFreeContentsMemory", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getFreeContentsMemory(ctx, _self, args, caller) {
            return browserAPI.browser.getFreeContentsMemory(args[0] == null ? undefined : yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "getFreeContentsMemory"),
    });
    browser.properties.set("isSupportedMedia", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$isSupportedMedia(ctx, _self, args, caller) {
            return browserAPI.browser.isSupportedMedia(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "isSupportedMedia"),
    });
    browser.properties.set("readPersistentArray", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$readPersistentArray(ctx, _self, args, caller) {
            const r = browserAPI.browser.readPersistentArray(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toString)(ctx, args[1], caller));
            return wrapArray(ctx, r);
        }, 2, "readPersistentArray"),
    });
    browser.properties.set("writePersistentArray", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$writePersistentArray(ctx, _self, args, caller) {
            const filename = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const structure = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const fields = BT.parseBinaryStructure(structure);
            if (fields == null) {
                return NaN;
            }
            if (!(0, es2_1.isObject)(args[2])) {
                return NaN;
            }
            const a = [];
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                switch (field.type) {
                    case BT.BinaryTableType.Boolean:
                        a[i] = (0, es2_1.toBoolean)(yield* (0, es2_1.getProperty)(ctx, args[2], String(i), caller));
                        break;
                    case BT.BinaryTableType.UnsignedInteger:
                    case BT.BinaryTableType.Integer:
                        a[i] = yield* (0, es2_1.toNumber)(ctx, yield* (0, es2_1.getProperty)(ctx, args[2], String(i), caller), caller);
                        break;
                    case BT.BinaryTableType.String:
                        a[i] = yield* (0, es2_1.toString)(ctx, yield* (0, es2_1.getProperty)(ctx, args[2], String(i), caller), caller);
                        break;
                }
            }
            return browserAPI.browser.writePersistentArray(filename, structure, a);
        }, 3, "writePersistentArray"),
    });
    browser.properties.set("checkAccessInfoOfPersistentArray", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$checkAccessInfoOfPersistentArray(ctx, _self, args, caller) {
            return browserAPI.browser.checkAccessInfoOfPersistentArray(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "checkAccessInfoOfPersistentArray"),
    });
    browser.properties.set("writePersistentArrayWithAccessCheck", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$writePersistentArrayWithAccessCheck(ctx, _self, args, caller) {
            const filename = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const structure = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const fields = BT.parseBinaryStructure(structure);
            if (fields == null) {
                return NaN;
            }
            if (!(0, es2_1.isObject)(args[2])) {
                return NaN;
            }
            const a = [];
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                switch (field.type) {
                    case BT.BinaryTableType.Boolean:
                        a[i] = (0, es2_1.toBoolean)(yield* (0, es2_1.getProperty)(ctx, args[2], String(i), caller));
                        break;
                    case BT.BinaryTableType.UnsignedInteger:
                    case BT.BinaryTableType.Integer:
                        a[i] = yield* (0, es2_1.toNumber)(ctx, yield* (0, es2_1.getProperty)(ctx, args[2], String(i), caller), caller);
                        break;
                    case BT.BinaryTableType.String:
                        a[i] = yield* (0, es2_1.toString)(ctx, yield* (0, es2_1.getProperty)(ctx, args[2], String(i), caller), caller);
                        break;
                }
            }
            return browserAPI.browser.writePersistentArrayWithAccessCheck(filename, structure, a);
        }, 3, "writePersistentArrayWithAccessCheck"),
    });
    browser.properties.set("readPersistentArrayWithAccessCheck", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$readPersistentArrayWithAccessCheck(ctx, _self, args, caller) {
            const r = browserAPI.browser.readPersistentArrayWithAccessCheck(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toString)(ctx, args[1], caller));
            return wrapArray(ctx, r);
        }, 2, "readPersistentArrayWithAccessCheck"),
    });
    browser.properties.set("connect", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$connect(ctx, _self, args, caller) {
            const tel = yield* (0, es2_1.toString)(ctx, args[0], caller);
            if (args.length < 5) {
                const bProvider = (0, es2_1.toBoolean)(args[1]);
                const speed = yield* (0, es2_1.toNumber)(ctx, args[2], caller);
                const timeout = yield* (0, es2_1.toNumber)(ctx, args[3], caller);
                return browserAPI.browser.connect(tel, bProvider, speed, timeout);
            }
            else {
                const hostNo = yield* (0, es2_1.toString)(ctx, args[1], caller);
                const bProvider = (0, es2_1.toBoolean)(args[2]);
                const speed = yield* (0, es2_1.toNumber)(ctx, args[3], caller);
                const timeout = yield* (0, es2_1.toNumber)(ctx, args[4], caller);
                return browserAPI.browser.connect(tel, hostNo, bProvider, speed, timeout);
            }
        }, 5, "connect"),
    });
    browser.properties.set("disconnect", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$disconnect(ctx, _self, args, caller) {
            return browserAPI.browser.disconnect();
        }, 0, "disconnect"),
    });
    browser.properties.set("sendTextData", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$sendTextData(ctx, _self, args, caller) {
            return browserAPI.browser.sendTextData(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller));
        }, 2, "sendTextData"),
    });
    browser.properties.set("receiveTextData", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$receiveTextData(ctx, _self, args, caller) {
            return browserAPI.browser.receiveTextData(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "receiveTextData"),
    });
    browser.properties.set("random", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$random(ctx, _self, args, caller) {
            return browserAPI.browser.random(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "random"),
    });
    browser.properties.set("getActiveDocument", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getActiveDocument(ctx, _self, args, caller) {
            return browserAPI.browser.getActiveDocument();
        }, 0, "getActiveDocument"),
    });
    browser.properties.set("getResidentAppVersion", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getResidentAppVersion(ctx, _self, args, caller) {
            const r = browserAPI.browser.getResidentAppVersion(yield* (0, es2_1.toString)(ctx, args[0], caller));
            return wrapArray(ctx, r);
        }, 1, "getResidentAppVersion"),
    });
    browser.properties.set("getLockedModuleInfo", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getLockedModuleInfo(ctx, _self, args, caller) {
            const r = browserAPI.browser.getLockedModuleInfo();
            return wrapArray(ctx, r);
        }, 0, "getLockedModuleInfo"),
    });
    browser.properties.set("detectComponent", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$detectComponent(ctx, _self, args, caller) {
            return browserAPI.browser.detectComponent(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "detectComponent"),
    });
    browser.properties.set("getProgramID", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getProgramID(ctx, _self, args, caller) {
            return browserAPI.browser.getProgramID(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "getProgramID"),
    });
    browser.properties.set("playRomSound", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$playRomSound(ctx, _self, args, caller) {
            return browserAPI.browser.playRomSound(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "playRomSound"),
    });
    browser.properties.set("getBrowserVersion", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getBrowserVersion(ctx, _self, args, caller) {
            const r = browserAPI.browser.getBrowserVersion();
            return wrapArray(ctx, r);
        }, 0, "getBrowserVersion"),
    });
    browser.properties.set("getTuningLinkageSource", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getTuningLinkageSource(ctx, _self, args, caller) {
            return browserAPI.browser.getTuningLinkageSource();
        }, 0, "getTuningLinkageSource"),
    });
    browser.properties.set("getTuningLinkageType", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getTuningLinkageType(ctx, _self, args, caller) {
            return browserAPI.browser.getTuningLinkageType();
        }, 0, "getTuningLinkageType"),
    });
    browser.properties.set("getIRDID", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getIRDID(ctx, _self, args, caller) {
            return browserAPI.browser.getIRDID(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "getIRDID"),
    });
    browser.properties.set("setISPParams", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$setISPParams(ctx, _self, args, caller) {
            const ispname = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const tel = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const bProvider = (0, es2_1.toBoolean)(args[2]);
            const uid = yield* (0, es2_1.toString)(ctx, args[3], caller);
            const passwd = yield* (0, es2_1.toString)(ctx, args[4], caller);
            const nameServer1 = yield* (0, es2_1.toString)(ctx, args[5], caller);
            const nameServer2 = yield* (0, es2_1.toString)(ctx, args[6], caller);
            const softCompression = (0, es2_1.toBoolean)(args[7]);
            const headerCompression = (0, es2_1.toBoolean)(args[8]);
            const idleTime = yield* (0, es2_1.toNumber)(ctx, args[9], caller);
            const status = yield* (0, es2_1.toNumber)(ctx, args[10], caller);
            const lineType = args[11] == null ? undefined : yield* (0, es2_1.toNumber)(ctx, args[11], caller);
            return browserAPI.browser.setISPParams(ispname, tel, bProvider, uid, passwd, nameServer1, nameServer2, softCompression, headerCompression, idleTime, status, lineType);
        }, 12, "setISPParams"),
    });
    browser.properties.set("getISPParams", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getISPParams(ctx, _self, args, caller) {
            return wrapArray(ctx, browserAPI.browser.getISPParams());
        }, 0, "getISPParams"),
    });
    browser.properties.set("connectPPP", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$connectPPP(ctx, _self, args, caller) {
            const tel = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const bProvider = (0, es2_1.toBoolean)(args[1]);
            const uid = yield* (0, es2_1.toString)(ctx, args[2], caller);
            const passwd = yield* (0, es2_1.toString)(ctx, args[3], caller);
            const nameServer1 = yield* (0, es2_1.toString)(ctx, args[4], caller);
            const nameServer2 = yield* (0, es2_1.toString)(ctx, args[5], caller);
            const softCompression = (0, es2_1.toBoolean)(args[6]);
            const headerCompression = (0, es2_1.toBoolean)(args[7]);
            const idleTime = yield* (0, es2_1.toNumber)(ctx, args[8], caller);
            return browserAPI.browser.connectPPP(tel, bProvider, uid, passwd, nameServer1, nameServer2, softCompression, headerCompression, idleTime);
        }, 9, "connectPPP"),
    });
    browser.properties.set("connectPPPWithISPParams", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$connectPPPWithISPParams(ctx, _self, args, caller) {
            return browserAPI.browser.connectPPPWithISPParams(args[0] == null ? undefined : yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "connectPPPWithISPParams"),
    });
    browser.properties.set("disconnectPPP", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$disconnectPPP(ctx, _self, args, caller) {
            return browserAPI.browser.disconnectPPP();
        }, 0, "disconnectPPP"),
    });
    browser.properties.set("isIPConnected", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$isIPConnected(ctx, _self, args, caller) {
            return browserAPI.browser.isIPConnected();
        }, 0, "isIPConnected"),
    });
    browser.properties.set("getConnectionType", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getConnectionType(ctx, _self, args, caller) {
            return browserAPI.browser.getConnectionType();
        }, 0, "getConnectionType"),
    });
    browser.properties.set("sendTextMail", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$sendTextMail(ctx, _self, args, caller) {
            const subject = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const body = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const toAddress = yield* (0, es2_1.toString)(ctx, args[2], caller);
            const ccAddress = [];
            for (let a of args.slice(3)) {
                ccAddress.push(yield* (0, es2_1.toString)(ctx, a, caller));
            }
            return wrapArray(ctx, browserAPI.browser.sendTextMail(subject, body, toAddress, ...ccAddress));
        }, 3, "sendTextMail"),
    });
    browser.properties.set("sendMIMEMail", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$sendMIMEMail(ctx, _self, args, caller) {
            const subject = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const src_module = yield* (0, es2_1.toString)(ctx, args[1], caller);
            const toAddress = yield* (0, es2_1.toString)(ctx, args[2], caller);
            const ccAddress = [];
            for (let a of args.slice(3)) {
                ccAddress.push(yield* (0, es2_1.toString)(ctx, a, caller));
            }
            return wrapArray(ctx, browserAPI.browser.sendMIMEMail(subject, src_module, toAddress, ...ccAddress));
        }, 3, "sendMIMEMail"),
    });
    browser.properties.set("setCacheResourceOverIP", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$setCacheResourceOverIP(ctx, _self, args, caller) {
            if (!(0, es2_1.isObject)(args[0])) {
                return NaN;
            }
            const length = yield* (0, es2_1.toNumber)(ctx, yield* (0, es2_1.getProperty)(ctx, args[0], "length", caller), caller);
            const resources = [];
            for (let i = 0; i < length; i++) {
                resources.push(yield* (0, es2_1.toString)(ctx, yield* (0, es2_1.getProperty)(ctx, args[0], String(i), caller), caller));
            }
            return wrapArray(ctx, browserAPI.browser.setCacheResourceOverIP(resources));
        }, 1, "setCacheResourceOverIP"),
    });
    browser.properties.set("getPrefixNumber", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getPrefixNumber(ctx, _self, args, caller) {
            return wrapArray(ctx, browserAPI.browser.getPrefixNumber());
        }, 0, "getPrefixNumber"),
    });
    browser.properties.set("vote", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$vote(ctx, _self, args, caller) {
            return browserAPI.browser.vote(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller));
        }, 2, "vote"),
    });
    browser.properties.set("isRootCertificateExisting", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$isRootCertificateExisting(ctx, _self, args, caller) {
            return browserAPI.browser.isRootCertificateExisting(yield* (0, es2_1.toNumber)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller), args[2] == null ? undefined : yield* (0, es2_1.toNumber)(ctx, args[2], caller));
        }, 3, "isRootCertificateExisting"),
    });
    browser.properties.set("getRootCertificateInfo", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getRootCertificateInfo(ctx, _self, args, caller) {
            return wrapArray(ctx, browserAPI.browser.getRootCertificateInfo());
        }, 0, "getRootCertificateInfo"),
    });
    browser.properties.set("setInterval", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$setInterval(ctx, _self, args, caller) {
            return browserAPI.browser.setInterval(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller), yield* (0, es2_1.toNumber)(ctx, args[2], caller));
        }, 3, "setInterval"),
    });
    browser.properties.set("clearTimer", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$clearTimer(ctx, _self, args, caller) {
            return browserAPI.browser.clearTimer(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "clearTimer"),
    });
    browser.properties.set("pauseTimer", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$pauseTimer(ctx, _self, args, caller) {
            return browserAPI.browser.pauseTimer(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "pauseTimer"),
    });
    browser.properties.set("resumeTimer", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$resumeTimer(ctx, _self, args, caller) {
            return browserAPI.browser.resumeTimer(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "resumeTimer"),
    });
    browser.properties.set("getNPT", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$getNPT(ctx, _self, args, caller) {
            return browserAPI.browser.getNPT();
        }, 0, "getNPT"),
    });
    browser.properties.set("X_DPA_getComBrowserUA", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$X_DPA_getComBrowserUA(ctx, _self, args, caller) {
            const r = browserAPI.browser.X_DPA_getComBrowserUA();
            return wrapArray(ctx, r);
        }, 0, "X_DPA_getComBrowserUA"),
    });
    browser.properties.set("X_DPA_startResidentApp", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$X_DPA_startResidentApp(ctx, _self, args, caller) {
            const appName = yield* (0, es2_1.toString)(ctx, args[0], caller);
            const showAV = yield* (0, es2_1.toNumber)(ctx, args[1], caller);
            const returnURI = yield* (0, es2_1.toString)(ctx, args[2], caller);
            const Ex_info = args.slice(3);
            const Ex_infoString = [];
            for (const e of Ex_info) {
                Ex_infoString.push(yield* (0, es2_1.toString)(ctx, e, caller));
            }
            return browserAPI.browser.X_DPA_startResidentApp(appName, showAV, returnURI, ...Ex_infoString);
        }, 3, "X_DPA_startResidentApp"),
    });
    browser.properties.set("X_DPA_getIRDID", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$X_DPA_getIRDID(ctx, _self, args, caller) {
            return browserAPI.browser.X_DPA_getIRDID(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
        }, 1, "X_DPA_getIRDID"),
    });
    browser.properties.set("X_DPA_writeCproBM", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$X_DPA_writeCproBM(ctx, _self, args, caller) {
            return browserAPI.browser.X_DPA_writeCproBM(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toString)(ctx, args[1], caller), yield* (0, es2_1.toString)(ctx, args[2], caller), yield* (0, es2_1.toNumber)(ctx, args[3], caller));
        }, 1, "X_DPA_writeCproBM"),
    });
    browser.properties.set("X_DPA_launchDocWithLink", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$X_DPA_launchDocWithLink(ctx, _self, args, caller) {
            return yield* X_DPA_launchDocWithLink(yield* (0, es2_1.toString)(ctx, args[0], caller), args[1] === undefined ? args[1] : yield* (0, es2_1.toString)(ctx, args[1], caller));
        }, 1, "X_DPA_launchDocWithLink"),
    });
    browser.properties.set("epgTune", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$epgTune(ctx, _self, args, caller) {
            return yield* epgTune(yield* (0, es2_1.toString)(ctx, args[0], caller));
        }, 1, "epgTune"),
    });
    browser.properties.set("loadDRCS", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$loadDRCS(ctx, _self, args, caller) {
            const r = yield browserAPI.asyncBrowser.loadDRCS(yield* (0, es2_1.toString)(ctx, args[0], caller));
            return r;
        }, 1, "loadDRCS"),
    });
    browser.properties.set("transmitTextDataOverIP", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$transmitTextDataOverIP(ctx, _self, args, caller) {
            const r = yield browserAPI.asyncBrowser.transmitTextDataOverIP(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toString)(ctx, args[1], caller), yield* (0, es2_1.toString)(ctx, args[2], caller));
            return wrapArray(ctx, r);
        }, 3, "transmitTextDataOverIP"),
    });
    browser.properties.set("confirmIPNetwork", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$confirmIPNetwork(ctx, _self, args, caller) {
            const r = yield browserAPI.asyncBrowser.confirmIPNetwork(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller), args[2] === undefined ? undefined : yield* (0, es2_1.toNumber)(ctx, args[2], caller));
            return wrapArray(ctx, r);
        }, 2, "confirmIPNetwork"),
    });
    browser.properties.set("sleep", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$sleep(ctx, _self, args, caller) {
            const r = yield browserAPI.asyncBrowser.sleep(yield* (0, es2_1.toNumber)(ctx, args[0], caller));
            return r;
        }, 1, "sleep"),
    });
    browser.properties.set("unlockScreen", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$unlockScreen(ctx, _self, args, caller) {
            const r = yield browserAPI.asyncBrowser.unlockScreen();
            return r;
        }, 0, "unlockScreen"),
    });
    browser.properties.set("X_CSP_setAccessInfoToProviderArea", {
        ...desc,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* browser$X_CSP_setAccessInfoToProviderArea(ctx, _self, args, caller) {
            const r = yield browserAPI.asyncBrowser.X_CSP_setAccessInfoToProviderArea(yield* (0, es2_1.toString)(ctx, args[0], caller), yield* (0, es2_1.toString)(ctx, args[1], caller));
            return r;
        }, 2, "X_CSP_setAccessInfoToProviderArea"),
    });
}
function defineBinaryTableBinding(context, resources, logger) {
    const desc = {
        readOnly: true,
        dontEnum: true,
        dontDelete: true
    };
    function* BinaryTable$construct(ctx, args, caller) {
        const table_ref = yield* (0, es2_1.toString)(ctx, args[0], caller);
        const structure = yield* (0, es2_1.toString)(ctx, args[1], caller);
        // P1: 表の読み出しとその結果を記録する。nullが返ったとき、ページ側には「行が無い」と
        // 区別が付かない — ここが両者を分ける唯一の場所
        const diagnostics = resources.diagnostics;
        const requestedId = resources.parseURLEx(table_ref);
        const normalized = requestedId.componentId != null && requestedId.moduleId != null
            ? `/${requestedId.componentId.toString(16).padStart(2, "0")}/${requestedId.moduleId.toString(16).padStart(4, "0")}${requestedId.filename == null ? "" : "/" + requestedId.filename}`
            : null;
        let res;
        try {
            res = yield resources.fetchResourceAsync(table_ref);
        }
        catch (error) {
            logger.error(`${logger.prefix}Failed to fetch BinaryTable resource`, table_ref, error);
            diagnostics.table(table_ref, normalized, structure, "fetch-failed", { error: String(error) });
            return null;
        }
        if (!res) {
            logger.log(`${logger.prefix}BinaryTable`, table_ref, "not found");
            diagnostics.table(table_ref, normalized, structure, "not-found");
            return null;
        }
        logger.log(`${logger.prefix}new BinaryTable`, table_ref);
        let buffer = res.data;
        const host = (0, es2_1.newObject)($BinaryTable$prototype);
        host.internalProperties.class = "BinaryTable";
        host.internalProperties.value = NaN;
        let bt;
        try {
            // P7: `.btb` string fields are ARIB text, so they are read by the designation rule and
            // not by the profile's plain decoder. The fallback is that decoder, so every field the
            // rule does not claim decodes byte for byte as before.
            const fallback = (0, text_1.getTextDecoder)(resources.profile);
            bt = new BT.BinaryTable(buffer, structure, (input) => (0, arib_text_1.decodeARIBText)(input, fallback, resources.textCoding));
        }
        catch (error) {
            // 壊れたデータや構造指定は BML 側へ例外を漏らさず null で通知する
            logger.error(`${logger.prefix}Failed to create BinaryTable`, table_ref, error);
            diagnostics.table(table_ref, normalized, structure, "unparseable", { bytes: buffer.length, error: String(error) });
            return null;
        }
        diagnostics.table(table_ref, normalized, structure, "found", { rows: bt.nrow, columns: bt.ncolumn, bytes: buffer.length });
        host.internalProperties.hostObjectValue = bt;
        host.properties.set("nrow", {
            ...desc,
            value: bt.nrow,
        });
        host.properties.set("ncolumn", {
            ...desc,
            value: bt.ncolumn,
        });
        return host;
    }
    ;
    const $BinaryTable = (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* $BinaryTable(ctx, _self, args, caller) {
        return yield* BinaryTable$construct(ctx, args, caller);
    }, 2, "BinaryTable");
    const $BinaryTable$prototype = (0, es2_1.newObject)(context.realm.intrinsics.ObjectPrototype);
    $BinaryTable$prototype.internalProperties.class = "BinaryTable";
    $BinaryTable$prototype.internalProperties.value = NaN;
    const dummyTable = new BT.BinaryTable(new Uint8Array([0]), "0,I:1B", (0, text_1.getTextDecoder)(resources.profile));
    dummyTable.fields.length = 0;
    dummyTable.rows.length = 0;
    $BinaryTable$prototype.internalProperties.hostObjectValue = dummyTable;
    $BinaryTable.internalProperties.construct = BinaryTable$construct;
    $BinaryTable.properties.set("prototype", {
        readOnly: true,
        dontEnum: true,
        dontDelete: true,
        value: $BinaryTable$prototype,
    });
    $BinaryTable$prototype.properties.set("nrow", {
        ...desc,
        value: 0,
    });
    $BinaryTable$prototype.properties.set("ncolumn", {
        ...desc,
        value: 0,
    });
    $BinaryTable$prototype.properties.set("constructor", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: $BinaryTable,
    });
    $BinaryTable$prototype.properties.set("close", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* $BinaryTable$prototype$close(ctx, self, args, caller) {
            if (!(self?.internalProperties.hostObjectValue instanceof BT.BinaryTable)) {
                throw new es2_1.InterpreterTypeError(`BinaryTable.prototype.close: Invalid call`, ctx, caller);
            }
            return self.internalProperties.hostObjectValue.close();
        }, 0, "close"),
    });
    $BinaryTable$prototype.properties.set("toNumber", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* $BinaryTable$prototype$toNumber(ctx, self, args, caller) {
            if (!(self?.internalProperties.hostObjectValue instanceof BT.BinaryTable)) {
                throw new es2_1.InterpreterTypeError(`BinaryTable.prototype.toNumber: Invalid call`, ctx, caller);
            }
            return self.internalProperties.hostObjectValue.toNumber(yield* (0, es2_1.toNumber)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller));
        }, 2, "toNumber"),
    });
    $BinaryTable$prototype.properties.set("toString", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* $BinaryTable$prototype$toString(ctx, self, args, caller) {
            if (!(self?.internalProperties.hostObjectValue instanceof BT.BinaryTable)) {
                throw new es2_1.InterpreterTypeError(`BinaryTable.prototype.toString: Invalid call`, ctx, caller);
            }
            if (args.length < 2) {
                // 普通のtoStringと被ってるので…
                return "[object hostobject]";
            }
            return self.internalProperties.hostObjectValue.toString(yield* (0, es2_1.toNumber)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller)) ?? null;
        }, 2, "toString"),
    });
    $BinaryTable$prototype.properties.set("toArray", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* $BinaryTable$prototype$toArray(ctx, self, args, caller) {
            if (!(self?.internalProperties.hostObjectValue instanceof BT.BinaryTable)) {
                throw new es2_1.InterpreterTypeError(`BinaryTable.prototype.toArray: Invalid call`, ctx, caller);
            }
            return wrapArray(ctx, self.internalProperties.hostObjectValue.toArray(yield* (0, es2_1.toNumber)(ctx, args[0], caller), yield* (0, es2_1.toNumber)(ctx, args[1], caller)));
        }, 2, "toArray"),
    });
    $BinaryTable$prototype.properties.set("search", {
        readOnly: false,
        dontEnum: true,
        dontDelete: false,
        value: (0, es2_1.newNativeFunction)(context.realm.intrinsics.FunctionPrototype, function* $BinaryTable$prototype$search(ctx, self, args, caller) {
            if (!(self?.internalProperties.hostObjectValue instanceof BT.BinaryTable)) {
                throw new es2_1.InterpreterTypeError(`BinaryTable.prototype.search: Invalid call`, ctx, caller);
            }
            // 開始行に続く検索条件は1～4組で、末尾に論理条件・件数・出力配列を取る
            if (args.length < 7 || args.length > 16 || (args.length - 4) % 3 !== 0) {
                return NaN;
            }
            const bt = self?.internalProperties.hostObjectValue;
            const startRow = yield* (0, es2_1.toNumber)(ctx, args[0], caller);
            const list = [];
            for (let i = 1; i < args.length - 3; i += 3) {
                const searchedColumn = yield* (0, es2_1.toNumber)(ctx, args[i], caller);
                const columnType = bt.fields[searchedColumn]?.type;
                if (columnType == null) {
                    return NaN;
                }
                let compared;
                switch (columnType) {
                    case BT.BinaryTableType.Boolean:
                        compared = (0, es2_1.toBoolean)(args[i + 1]);
                        break;
                    case BT.BinaryTableType.UnsignedInteger:
                    case BT.BinaryTableType.Integer:
                    case BT.BinaryTableType.ZipCode:
                        compared = yield* (0, es2_1.toNumber)(ctx, args[i + 1], caller);
                        break;
                    case BT.BinaryTableType.String:
                        compared = yield* (0, es2_1.toString)(ctx, args[i + 1], caller);
                        break;
                    case BT.BinaryTableType.Pad:
                    default:
                        return NaN;
                }
                const operator = yield* (0, es2_1.toNumber)(ctx, args[i + 2], caller);
                list.push([searchedColumn, compared, operator]);
            }
            const logic = (0, es2_1.toBoolean)(args[args.length - 3]);
            const limitCount = yield* (0, es2_1.toNumber)(ctx, args[args.length - 2], caller);
            const resultArray = args[args.length - 1];
            if (!(0, es2_1.isObject)(resultArray) || resultArray.internalProperties.class !== "Array") {
                return NaN;
            }
            const result = [];
            const r = bt.search(startRow, ...list.flatMap(x => x), logic, limitCount, result);
            for (let i = 0; i < result.length; i++) {
                yield* (0, es2_1.putProperty)(ctx, resultArray, String(i), wrapArray(ctx, result[i]), caller);
            }
            yield* (0, es2_1.putProperty)(ctx, resultArray, "length", result.length, caller);
            return r;
        }, 2, "search"),
    });
    context.realm.globalObject.properties.set("BinaryTable", {
        readOnly: false,
        dontEnum: false,
        dontDelete: false,
        value: $BinaryTable,
    });
}
//# sourceMappingURL=es2_binding.js.map