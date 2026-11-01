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
exports.BrowserAPI = void 0;
const profile_1 = require("./profile");
const format_1 = require("./format");
const drcs = __importStar(require("./media/drcs"));
const romsound_1 = require("./media/romsound");
const euc_jp_1 = require("./charset/euc_jp");
const shift_jis_1 = require("./charset/shift_jis");
const apiGroup = new Map([
    ["Class.BinaryTable", 1],
    ["Class.CSVTable", 0],
    ["Class.XMLDoc", 0],
    ["EPG.Basic", 1], // FIXME: 未実装あり (the EPG host hooks are declared but not called by the engine)
    ["EPG.Basic2", 0], // 未実装: the EPG host hooks (contracts.EPG) are declared but not called by the engine
    ["EPG.Ext", 0], // epgTuneToDocument 運用しない
    ["EPG.Group", 0], // grp.., epgXTune 運用しない
    ["EPG.Series", 0], // series... オプション
    ["CC.Stream", 0],
    ["CC.Control", 0], // 未実装: no caption-display control
    ["Persistent.Ext", 0],
    ["Persistent.Basic", 1],
    ["Persistent.MediaSupport", 0], // 未実装: setAccessInfoOfPersistentArray has no media arm
    ["Storage.Dir.Dest", 0],
    ["Storage.Dir", 0],
    ["Storage.Dir.Ext", 0],
    ["Storage.File.Dest", 0],
    ["Storage.File", 0],
    ["Storage.File.Ext", 0],
    ["Storage.IO", 0],
    ["Storage.Basic", 0],
    ["Storage.Carousel", 0],
    ["Storage.Module", 0],
    ["Storage.Carousel.Ext", 0],
    ["Storage.Module.Ext", 0],
    ["Storage.Resource.Ext", 0],
    ["Storage.Resource", 0],
    ["Com.BASIC.Basic", 0],
    ["Com.BASIC.Ext", 0],
    ["Com.BASIC.Delay", 0],
    ["Com.BASIC.Delayed", 0],
    ["Com.BASIC.Vote", 0],
    ["Com.BASIC.CAS", 0],
    ["Com.BASIC.Enc", 0],
    ["Com.IP.Params", 0],
    ["Com.IP.Connect", 0],
    ["Com.IP.Connect.Ext", 0],
    ["Com.IP.GetType", 1],
    ["Com.IP", 1],
    ["Com.IP.Http.Ext", 0],
    ["Com.IP.Http", 0],
    ["Com.IP.Ftp.Ext", 0],
    ["Com.IP.Ftp", 0],
    ["Com.IP.Sendmail", 0],
    ["Com.IP.Transmit", 1],
    ["Com.IP.Delayed", 0],
    ["Com.IP.SetCache", 0],
    ["Com.IP.confirmIP", 1],
    ["Com.Common.Delayed", 0],
    ["Com.Line.Prefix", 1],
    ["Com.Certificate", 0], // 未実装: isRootCertificateExisting/getRootCertificateInfo are stubs
    ["Ctrl.Basic", 1],
    ["Ctrl.NPT", 1],
    ["Ctrl.Time", 1],
    ["Ctrl.Exec", 0],
    ["Ctrl.Cache", 0], // 未実装: setCachePriority is a stub
    ["Ctrl.Link", 0],
    ["Ctrl.PgmHyperlink", 0],
    ["Ctrl.Version", 1],
    ["Ctrl.Screen", 1],
    ["Ctrl.Com", 0], // オプション扱い
    ["Ctrl.Quit", 1],
    ["Ctrl.ExtApp", 0], // オプション扱い
    ["Ctrl.Cache.Ext", 1],
    ["Ctrl.Media", 1],
    ["Ctrl.Basic2", 1],
    ["Ctrl.Cache2", 1],
    ["Ctrl.MobileDisplay", 0],
    ["Ctrl.AppVersion", 1],
    ["Ctrl.startResidentApp", 0],
    ["Ctrl.startExtraBrowser", 0],
    ["Misc.SmartDevice.transmitData", 0],
    ["RomSound.Basic", 1],
    ["Timer.Basic", 1],
    ["Timer.Ext", 0],
    ["Timer.DateMode", 1],
    ["Misc.DRCS", 1],
    ["Misc.DRCS.unload", 0],
    ["Misc.Peripheral", 0],
    ["Misc.Peripheral.pass", 0],
    ["Misc.Peripheral.Array", 0],
    ["Bookmark.Basic", 0], // 未実装: the bookmark APIs are stubs
    ["Bookmark.Extended", 0], // 未実装: the bookmark APIs are stubs
    ["Bookmark.Resident", 0],
    ["Misc.Basic", 1],
    ["Misc.Ureg", 1],
    ["Misc.Greg", 1],
    ["Print.Basic", 0],
    ["Print.MemoryCard", 0],
    ["Iptv.Vod", 0],
    ["Iptv.Download", 0],
    ["AITControlledApp.Start", 0],
    // TR-B14 第二分冊 
    ["Bookmark.Basic2", 0], // 未実装: getBookmarkInfo2 is a stub
    ["Ctrl.Status", 1], // getBrowserStatus
    ["Storage.Source", 0], // getContentSource
]);
const residentApp = new Map([
    ["JapaneseInput", 0],
    ["netTVBrowser", 0],
    ["IPTVBMLBrowser", 0],
    ["VOD", 0],
    ["Download", 0],
    ["webBrowserMode1", 0],
    ["webBrowserMode2", 0],
    ["HTMLBrowser", 0],
    ["ReservedTransmission", 0],
    ["MailClient", 0],
    ["Bookmark", 0],
]);
const transmissionProtocol = new Map([
    ["datalink", new Map([["PPP.modem", 0]])],
    ["application", new Map([
            ["HTTP", new Map([
                    [undefined, 1],
                    ["1.0", 1],
                    ["1.1", 1],
                ])],
            ["FTP", 0],
            ["TLS", new Map([
                    [undefined, 1],
                    ["1.0", 1],
                    ["1.1", 1],
                    ["1.2", 1],
                    ["1.3", 1],
                ])],
            ["physical", new Map([["basic", 0]])],
        ])],
]);
const extraBrowserFunction = new Map([
    ["netTVVOD", 0],
    ["netTVDownload", 0],
    ["IPTVBMLVOD", 0],
    ["IPTVBMLDownload", 0],
]);
const unsupported = new Map([
    ["Misc.Unlink", 1], // 非リンク状態未実装
    ["Com.BASIC.Basic", 1],
    ["Com.BASIC.Vote", 1],
]);
const caSystem = new Map([
    ["0x0005", 1], // [BA]-CAS番号
    ["0x000D", 0],
]);
const iptvFunction = new Map([
    ["VOD", new Map([
            ["HTTP", 0],
            ["RTSP", 0],
        ])],
]);
const irdid = new Map([
    ["0xF001", 0],
]);
const smartDeviceProfile = new Map([
    ["SmartDeviceMode1", 0],
    ["SmartDeviceMode2", 0],
]);
const aitControlledAppEngineFunction = new Map([
    ["IPTV-F", new Map([
            // フェーズ0運用のみ実装
            ["HTML5_ph0", 0],
            // フェーズ1運用を実装
            ["HTML5_ph1", 0],
        ])]
]);
const aitTransferMethod = new Map([
    ["XML", new Map([
            ["HTTP", 0],
        ])]
]);
const aitTransportMethod = new Map([
    ["XML", new Map([
            ["HTTP", 0],
        ])],
    ["Section", new Map([
            ["DataCarousel", 0],
        ])],
]);
const nvram = new Map([
    ["BSspecifiedExtension", new Map([["48", 1]])],
    ["NumberOfBSBroadcasters", new Map([["23", 1]])],
    ["NumberOfCSBroadcasters", new Map([["23", 1]])],
]);
const characterEncoding = new Map([
    ["Shift-JIS", 0],
    ["UTF-8", 0],
    ["UTF-16", 0],
    ["EUC-JP", 1],
    ["JIS8TEXT", 0],
]);
const osdResolution = new Map([
    ["1920x1080", 1],
    ["1280x720", 1],
    ["960x540", 1],
    ["720x480", 1],
]);
const arib = new Map([
    ["APIGroup", apiGroup],
    ["ResidentApp", residentApp],
    ["TransmissionProtocol", transmissionProtocol],
    ["ExtraBrowserFunction", extraBrowserFunction],
    ["Unsupported", unsupported],
    ["CASystem", caSystem],
    ["IPTVFunction", iptvFunction],
    ["IRDID", irdid],
    ["SmartDeviceProfile", smartDeviceProfile],
    ["AITControlledAppEngineFunction", aitControlledAppEngineFunction],
    ["AITTransferMethod", aitTransferMethod],
    ["AITTransportMethod", aitTransportMethod],
    ["nvram", nvram],
    ["ResidentBookmark", 0],
    ["BookmarkButton", 0],
    ["KanaInput", 1],
    ["CharacterEncoding", characterEncoding],
    ["OSDResolution", osdResolution],
]);
const cproAPIGroup = new Map([
    ["Misc.Basic", 1],
    ["EPG.Basic", 1],
    ["EPG.Ext", 0],
    ["Persistent.Basic", 1],
    ["Com.IP.GetType ", 1],
    ["Com.IP", 1],
    ["Com.IP.Transmit", 1],
    ["Ctrl.Basic", 1],
    ["Ctrl.RAVersion", 1], // getResidentAppVersion
    ["Ctrl.MobileDisplay", 0], // setFullDataDisplayArea
    ["RomSound.Basic", 1],
    ["Timer.Basic", 1],
    ["Timer.DateMode", 1],
    ["Storage.Ext", 0],
    ["Print.MemoryCard1", 0],
    ["Print.MemoryCard2", 0],
    ["Xdpa.mailTo", 0],
    ["Xdpa.RAStart", 1],
    ["Xdpa.phoneTo", 0],
    ["Xdpa.RcvCond", 0],
    ["Xdpa.CurPos", 0],
    ["Xdpa.saveExApp", 0],
    ["Xdpa.startExAv", 0],
    ["Xdpa.stopExAv", 0],
    ["Xdpa.tuneRF", 0],
    ["Xdpa.SchInfo", 0],
    ["Xdpa.ComBrowserUA", 1],
    ["Xdpa.AddressBook", 0],
    ["Xdpa.launchWithL", 1],
    ["Xdpa.chkAV", 0],
    ["Xdpa.getIRDID", 1],
    ["Xdpa.CproBM", 0],
]);
const cproResidentApp = new Map([
    ["ComBrowser", 0],
    ["Bookmark", 0],
    ["JapaneseInput", 0],
]);
const cproWriteCproBM = new Map([
    ["BMtype02", 0],
    ["BMtype03", 0],
    ["BMtype04", 0],
]);
const cproOSDResolution = new Map([
    ["240x480", 1],
]);
const cproTransmissionProtocol = new Map([
    ["application", new Map([
            ["HTTP", new Map([
                    [undefined, 1],
                    ["1.0", 1],
                    ["1.1", 1],
                ])],
            ["TLS", new Map([
                    [undefined, 1],
                    ["1.0", 1],
                    ["1.1", 1],
                    ["1.2", 1],
                    ["1.3", 1],
                ])],
        ])],
]);
const dpaCpro = new Map([
    ["APIGroup", cproAPIGroup],
    ["ResidentApp", cproResidentApp],
    ["WriteCproBM", cproWriteCproBM],
    ["OSDResolution", cproOSDResolution],
    ["TransmissionProtocol", cproTransmissionProtocol],
    ["BookmarkButton", 0],
]);
const bpa = new Map([
    ["APIGroup", new Map([
            ["Persistent.Media.Support.Ext", 0], // X_BPA_setAccessInfoOfPersistentArrayForAnotherProvider
        ])]
]);
class BrowserAPI {
    resources;
    eventQueue;
    eventDispatcher;
    content;
    nvram;
    interpreter;
    audioNodeProvider;
    ip;
    indicator;
    ureg;
    greg;
    X_DPA_startResidentApp;
    logger;
    constructor(resources, eventQueue, eventDispatcher, content, nvram, interpreter, audioNodeProvider, ip, indicator, ureg, greg, X_DPA_startResidentApp, logger) {
        this.resources = resources;
        this.eventQueue = eventQueue;
        this.eventDispatcher = eventDispatcher;
        this.content = content;
        this.nvram = nvram;
        this.interpreter = interpreter;
        this.audioNodeProvider = audioNodeProvider;
        this.ip = ip;
        this.indicator = indicator;
        this.ureg = ureg ?? {
            getReg: (index) => this.browser.Ureg[index],
            setReg: (index, value) => this.browser.Ureg[index] = value,
        };
        this.greg = greg ?? {
            getReg: (index) => this.browser.Greg[index],
            setReg: (index, value) => this.browser.Greg[index] = value,
        };
        this.X_DPA_startResidentApp = X_DPA_startResidentApp;
        this.logger = logger;
    }
    asyncBrowser = {
        loadDRCS: async (DRCS_ref) => {
            this.logger.debug(`loadDRCS`, DRCS_ref);
            const res = await this.resources.fetchResourceAsync(DRCS_ref);
            if (res?.data == null) {
                return NaN;
            }
            // A malformed DRCS payload must answer NaN like the fetch failure above, not reject:
            // this is an async browser API and a rejection surfaces as an interpreter error.
            try {
                this.content.loadDRCS(drcs.loadDRCS(res.data));
                for (const [id, fontFamily] of [
                    [1, "丸ゴシック"],
                    [2, "角ゴシック"],
                    [3, "太丸ゴシック"],
                ]) {
                    const glyph = drcs.loadDRCS(res.data, id);
                    const { ttf, unicodeCharacters } = drcs.toTTF(glyph);
                    if (unicodeCharacters.length === 0) {
                        continue;
                    }
                    this.content.addDRCSFont(new FontFace(fontFamily, ttf, {
                        unicodeRange: unicodeCharacters.map(x => "U+" + x.toString(16)).join(","),
                    }));
                }
            }
            catch (e) {
                this.logger.error(`loadDRCS failed`, DRCS_ref, e);
                return NaN;
            }
            return 1;
        },
        transmitTextDataOverIP: async (uri, text, charset) => {
            this.logger.log(`transmitTextDataOverIP`);
            if (this.ip.transmitTextDataOverIP == null) {
                return [NaN, "", ""];
            }
            // Internet content may only post inside its base URI directory.
            if (this.resources.isInternetContent && !this.resources.checkBaseURIDirectory(uri)) {
                this.logger.error(`base URI directory violation (post)`, uri);
                return [NaN, "", ""];
            }
            function encodeBinary(data) {
                let encoded = "";
                for (const c of data) {
                    const s = String.fromCharCode(c);
                    if ((s >= "A" && s <= "Z") || (s >= "a" && s <= "z") || (s >= "0" && s <= "9") || "-_.!~*'()".indexOf(s) !== -1) {
                        encoded += s;
                    }
                    else {
                        encoded += "%";
                        encoded += c.toString(16).padStart(2, "0");
                    }
                }
                return encoded;
            }
            const transmit = this.ip.transmitTextDataOverIP;
            const post = async (data, decode) => {
                this.indicator?.setNetworkingPostStatus(true);
                try {
                    const res = await transmit(uri, new TextEncoder().encode("Denbun=" + encodeBinary(data)));
                    // BML result code: 1 when the request was answered, NaN when the transport failed.
                    return [1, String(res.status), decode(res.body)];
                }
                catch (e) {
                    this.logger.error(`transmitTextDataOverIP failed`, uri, e);
                    return [NaN, "", ""];
                }
                finally {
                    this.indicator?.setNetworkingPostStatus(false);
                }
            };
            if (charset === "EUC-JP") {
                return await post((0, euc_jp_1.encodeEUCJP)(text), euc_jp_1.decodeEUCJP);
            }
            else if (charset === "Shift_JIS") {
                // Cプロファイル
                return await post((0, shift_jis_1.encodeShiftJIS)(text), shift_jis_1.decodeShiftJIS);
            }
            else {
                return [NaN, "", ""];
            }
        },
        confirmIPNetwork: async (destination, confirmType, timeout) => {
            this.logger.log(`confirmIPNetwork`);
            if (this.ip.confirmIPNetwork == null) {
                return null;
            }
            const result = await this.ip.confirmIPNetwork(destination, Number(confirmType) === 1, Number(timeout ?? 4000));
            if (result == null) {
                return null;
            }
            return [result.success, result.ipAddress, result.responseTimeMillis];
        },
        sleep: async (interval) => {
            return new Promise((resolve) => {
                this.logger.debug(`SLEEP `, interval);
                setTimeout(() => {
                    this.logger.debug(`END SLEEP `, interval);
                    resolve(1);
                }, interval);
            });
        },
        unlockScreen: async () => {
            return new Promise((resolve) => {
                requestAnimationFrame(() => {
                    resolve(1);
                });
            });
        },
        X_CSP_setAccessInfoToProviderArea: async (filename, structure) => {
            if (structure !== "S:1V,U:2B") {
                return NaN;
            }
            const res = await this.resources.fetchResourceAsync(filename);
            if (res?.data == null) {
                return NaN;
            }
            else if (this.nvram.cspSetAccessInfoToProviderArea(res.data)) {
                return 1;
            }
            else {
                return NaN;
            }
        }
    };
    getGreg(index) {
        if (index >= 0 && index < this.browser.Greg.length) {
            return this.greg.getReg(index);
        }
        else {
            return undefined;
        }
    }
    setGreg(index, value) {
        if (index >= 0 && index < this.browser.Greg.length) {
            this.greg.setReg(index, this.resources.profile === profile_1.Profile.TrProfileC ? (0, shift_jis_1.stripStringShiftJIS)(value, 256) : (0, euc_jp_1.stripStringEUCJP)(value, 256));
        }
    }
    getUreg(index) {
        if (index >= 0 && index < this.browser.Ureg.length) {
            return this.ureg.getReg(index);
        }
        else {
            return undefined;
        }
    }
    setUreg(index, value) {
        if (index >= 0 && index < this.browser.Ureg.length) {
            this.ureg.setReg(index, this.resources.profile === profile_1.Profile.TrProfileC ? (0, shift_jis_1.stripStringShiftJIS)(value, 256) : (0, euc_jp_1.stripStringEUCJP)(value, 256));
        }
    }
    browser = {
        Ureg: [...new Array(64)].map(_ => ""),
        Greg: [...new Array(64)].map(_ => ""),
        epgGetEventStartTime: (event_ref) => {
            if (event_ref == this.resources.eventURI) {
                this.logger.debug(`epgGetEventStartTime`, event_ref);
                const time = this.resources.startTimeUnixMillis;
                if (time == null) {
                    return null;
                }
                return new Date(time);
            }
            this.logger.error(`epgGetEventStartTime: not implemented`, event_ref, this.resources.eventId);
            return null;
        },
        epgGetEventDuration: (event_ref) => {
            if (event_ref == this.resources.eventURI) {
                this.logger.debug(`epgGetEventDuration`, event_ref);
                return this.resources.durationSeconds ?? NaN;
            }
            this.logger.error(`epgGetEventDuration`, event_ref);
            return NaN;
        },
        // The engine does not call the host's contracts.EPG hooks: this API reports "not performed"
        // rather than pretending to have tuned. Wiring it needs a service/component reference parse
        // and a transition, which is a host-side decision this engine has not taken.
        epgTune: (service_ref) => {
            this.logger.debug(`epgTune stub`, { service_ref });
            return NaN;
        },
        epgTuneToComponent: (component_ref) => {
            this.logger.debug(`epgTuneToComponent stub`, { component_ref });
            return NaN;
        },
        epgIsReserved: (event_ref) => {
            this.logger.debug(`epgIsReserved stub`, { event_ref });
            return NaN;
        },
        epgReserve: (event_ref, startTime) => {
            this.logger.debug(`epgReserve stub`, { event_ref, startTime });
            return NaN;
        },
        epgCancelReservation: (event_ref) => {
            this.logger.debug(`epgCancelReservation stub`, { event_ref });
            return NaN;
        },
        epgRecIsReserved: (event_ref, startTime) => {
            this.logger.debug(`epgRecIsReserved stub`, { event_ref, startTime });
            return NaN;
        },
        epgRecReserve: (event_ref, startTime) => {
            this.logger.debug(`epgRecReserve stub`, { event_ref, startTime });
            return NaN;
        },
        epgRecCancelReservation: (event_ref) => {
            this.logger.debug(`epgRecCancelReservation stub`, { event_ref });
            return NaN;
        },
        setCCDisplayStatus: (language, status) => {
            this.logger.debug(`setCCDisplayStatus stub`, { language, status });
            // CC.Control is not advertised, so no language has a display status to set.
            return NaN;
        },
        getCCDisplayStatus: (language) => {
            this.logger.debug(`getCCDisplayStatus stub`, { language });
            // No caption display exists, so every valid language answers "off" rather than "on".
            if (language >= 1 && language <= 8) {
                return 0;
            }
            return NaN;
        },
        getCCLanguageStatus: (language) => {
            this.logger.debug(`getCCLanguageStatus stub`, { language });
            // CC.Control is not advertised; no language can be "available" when no display exists.
            if (language >= 1 && language <= 8) {
                return 0;
            }
            return NaN;
        },
        writeBookmarkArray: (filename, title, dstURI, expire_str, bmType, linkMedia, usageFlag, extendedStructure, extendedData) => {
            this.logger.debug(`writeBookmarkArray stub`, { filename, title, dstURI, expire_str, bmType, linkMedia, usageFlag, extendedStructure, extendedData });
            return NaN;
        },
        readBookmarkArray: (filename, bmType, extendedStructure) => {
            this.logger.debug(`readBookmarkArray stub`, { filename, bmType, extendedStructure });
            return null;
        },
        deleteBookmark: (filename) => {
            this.logger.debug(`deleteBookmark stub`, { filename });
            return NaN;
        },
        lockBookmark: (filename) => {
            this.logger.debug(`lockBookmark stub`, { filename });
            return NaN;
        },
        unlockBookmark: (filename) => {
            this.logger.debug(`unlockBookmark stub`, { filename });
            return NaN;
        },
        getBookmarkInfo: () => {
            this.logger.debug(`getBookmarkInfo stub`);
            return null;
        },
        getBookmarkInfo2: (region_name) => {
            this.logger.debug(`getBookmarkInfo2 stub`, { region_name });
            return null;
        },
        setCurrentDateMode: (time_mode) => {
            this.logger.debug(`setCurrentDateMode`, time_mode);
            if (time_mode == 0) {
                this.content.currentDateMode = 0;
            }
            else if (time_mode == 1) {
                this.content.currentDateMode = 1;
            }
            else {
                return NaN;
            }
            return 1; // 成功
        },
        getProgramRelativeTime: () => {
            this.logger.debug(`getProgramRelativeTime`);
            const ct = this.resources.currentTimeUnixMillis;
            const st = this.resources.startTimeUnixMillis;
            if (ct == null || st == null) {
                return NaN;
            }
            else {
                return Math.floor((ct - st) / 1000); // 秒
            }
        },
        isBeingBroadcast: (event_ref) => {
            this.logger.debug(`isBeingBroadcast stub`, { event_ref });
            return false;
        },
        subDate(target, base, unit) {
            if (target == null || base == null) {
                return NaN;
            }
            const sub = target.getTime() - base.getTime();
            let result;
            if (unit == 1) {
                result = Math.trunc(sub / 1000);
            }
            else if (unit == 2) {
                result = Math.trunc(sub / (1000 * 60));
            }
            else if (unit == 3) {
                result = Math.trunc(sub / (1000 * 60 * 60));
            }
            else if (unit == 4) {
                result = Math.trunc(sub / (1000 * 60 * 60 * 24));
            }
            else if (unit == 5) {
                result = Math.trunc(sub / (1000 * 60 * 60 * 24 * 7));
            }
            else {
                result = sub;
            }
            if (result < -2147483648 || result > 2147483647) {
                return NaN;
            }
            return result;
        },
        addDate(base, time, unit) {
            if (Number.isNaN(time)) {
                return base;
            }
            // STD-B24 第二編 7.6.14: unit が有効値以外なら unit を 0 (ミリ秒) として扱う
            if (unit == 1) {
                return new Date(base.getTime() + (time * 1000));
            }
            else if (unit == 2) {
                return new Date(base.getTime() + (time * 1000 * 60));
            }
            else if (unit == 3) {
                return new Date(base.getTime() + (time * 1000 * 60 * 60));
            }
            else if (unit == 4) {
                return new Date(base.getTime() + (time * 1000 * 60 * 60 * 24));
            }
            else if (unit == 5) {
                return new Date(base.getTime() + (time * 1000 * 60 * 60 * 24 * 7));
            }
            else {
                return new Date(base.getTime() + time);
            }
        },
        formatNumber(value) {
            let number = Number(value);
            // STD-B24 第二編 7.6.14: value が有効値以外なら value を 0 として扱う
            if (Number.isNaN(number)) {
                number = 0;
            }
            return number.toLocaleString("en-US");
        },
        unlockModuleOnMemory: (module) => {
            this.logger.debug(`unlockModuleOnMemory`, module);
            const { componentId, moduleId } = this.resources.parseURLEx(module);
            if (componentId == null || moduleId == null) {
                this.resources.diagnostics.lock("unlockModuleOnMemory", module ?? null, null, NaN, "invalid-reference");
                return NaN;
            }
            const unlocked = this.resources.unlockModule(componentId, moduleId, "lockModuleOnMemory");
            this.resources.diagnostics.lock("unlockModuleOnMemory", module ?? null, (0, format_1.formatModuleRef)(componentId, moduleId), unlocked ? 1 : NaN, unlocked ? "unlocked" : "unlock-refused");
            return unlocked ? 1 : NaN;
        },
        setCachePriority: (module, priority) => {
            // Ctrl.Cache is not advertised (getBrowserSupport answers 0), so this must not claim
            // success: a page that checks and gets 1 would believe the priority was applied.
            this.logger.debug(`setCachePriority: stub`, { module, priority });
            return NaN;
        },
        unlockModuleOnMemoryEx: (module) => {
            this.logger.debug(`unlockModuleOnMemoryEx`, module);
            const { componentId, moduleId } = this.resources.parseURLEx(module);
            if (componentId == null || moduleId == null) {
                this.resources.diagnostics.lock("unlockModuleOnMemoryEx", module ?? null, null, NaN, "invalid-reference");
                return NaN;
            }
            const unlocked = this.resources.unlockModule(componentId, moduleId, "lockModuleOnMemoryEx");
            this.resources.diagnostics.lock("unlockModuleOnMemoryEx", module ?? null, (0, format_1.formatModuleRef)(componentId, moduleId), unlocked ? 1 : NaN, unlocked ? "unlocked" : "unlock-refused");
            return unlocked ? 1 : NaN;
        },
        unlockAllModulesOnMemory: () => {
            this.logger.debug(`unlockAllModulesOnMemory`);
            this.resources.unlockModules();
            this.resources.diagnostics.lock("unlockAllModulesOnMemory", null, null, 1, "all-unlocked");
            return 1; // NaN => fail
        },
        lockModuleOnMemory: (module) => {
            this.logger.debug(`lockModuleOnMemory`, module);
            const diagnostics = this.resources.diagnostics;
            const { componentId, moduleId } = this.resources.parseURLEx(module);
            if (componentId == null || moduleId == null || module == null) {
                diagnostics.lock("lockModuleOnMemory", module ?? null, null, NaN, "invalid-reference");
                return NaN;
            }
            const normalized = (0, format_1.formatModuleRef)(componentId, moduleId);
            // lockModuleOnMemoryExでロックされているモジュールをlockModuleOnMemoryでロックできない
            if (this.resources.getModuleLockedBy(componentId, moduleId) === "lockModuleOnMemoryEx") {
                diagnostics.lock("lockModuleOnMemory", module, normalized, NaN, "refused-other-lock");
                return NaN;
            }
            if (!this.resources.getPMTComponent(componentId)) {
                this.logger.error(`lockModuleOnMemory: component does not exist in PMT`, module);
                diagnostics.lock("lockModuleOnMemory", module, normalized, -1, "no-pmt-component");
                return -1;
            }
            if (this.resources.componentExistsInDownloadInfo(componentId)) {
                if (!this.resources.moduleExistsInDownloadInfo(componentId, moduleId)) {
                    this.logger.error(`lockModuleOnMemory: component does not exist in DII`, module);
                    diagnostics.lock("lockModuleOnMemory", module, normalized, -1, "no-dii-module");
                    return -1;
                }
            }
            const cachedModule = this.resources.lockCachedModule(componentId, moduleId, "lockModuleOnMemory");
            if (!cachedModule) {
                this.logger.log(`lockModuleOnMemory: module not cached`, module);
                const record = diagnostics.lock("lockModuleOnMemory", module, normalized, 1, "requested");
                this.resources.fetchResourceAsync(module, "lockModuleOnMemory").then(() => {
                    const cachedModule = this.resources.lockCachedModule(componentId, moduleId, "lockModuleOnMemory");
                    if (cachedModule == null) {
                        // 発生しない?
                        diagnostics.settleLock(record, "failed-after-request");
                        return;
                    }
                    diagnostics.settleLock(record, "locked");
                    this.eventDispatcher.dispatchModuleLockedEvent(module, false, 0);
                });
                return 1;
            }
            // イベントハンドラではモジュール名の大文字小文字がそのままである必要がある?
            diagnostics.lock("lockModuleOnMemory", module, normalized, 1, "locked");
            this.eventDispatcher.dispatchModuleLockedEvent(module, false, 0);
            return 1;
        },
        lockModuleOnMemoryEx: (module) => {
            this.logger.debug(`lockModuleOnMemoryEx`, module);
            const diagnostics = this.resources.diagnostics;
            const { componentId, moduleId } = this.resources.parseURLEx(module);
            if (componentId == null || moduleId == null || module == null) {
                diagnostics.lock("lockModuleOnMemoryEx", module ?? null, null, NaN, "invalid-reference");
                return NaN;
            }
            const normalized = (0, format_1.formatModuleRef)(componentId, moduleId);
            if (this.resources.profile !== profile_1.Profile.TrProfileC) {
                // TR-B14 第二分冊 5.12.6.9 (6) 参照
                if (componentId !== 0x40 && componentId !== 0x50 && componentId !== 0x60) {
                    diagnostics.lock("lockModuleOnMemoryEx", module, normalized, NaN, "refused-component");
                    return NaN;
                }
            }
            // lockModuleOnMemoryでロックされているモジュールをlockModuleOnMemoryExでロックできない
            if (this.resources.getModuleLockedBy(componentId, moduleId) === "lockModuleOnMemory") {
                diagnostics.lock("lockModuleOnMemoryEx", module, normalized, NaN, "refused-other-lock");
                return NaN;
            }
            if (!this.resources.getPMTComponent(componentId)) {
                this.logger.error(`lockModuleOnMemoryEx: component does not exist in PMT`, module);
                diagnostics.lock("lockModuleOnMemoryEx", module, normalized, -3, "no-pmt-component");
                return -3;
            }
            if (this.resources.componentExistsInDownloadInfo(componentId)) {
                if (!this.resources.moduleExistsInDownloadInfo(componentId, moduleId)) {
                    this.logger.error(`lockModuleOnMemoryEx: component does not exist in DII`, module);
                    diagnostics.lock("lockModuleOnMemoryEx", module, normalized, 1, "no-dii-module");
                    this.eventDispatcher.dispatchModuleLockedEvent(module, true, -2);
                    return 1;
                }
            }
            const cachedModule = this.resources.lockCachedModule(componentId, moduleId, "lockModuleOnMemoryEx");
            if (!cachedModule) {
                const dataEventId = this.resources.getDownloadComponentInfo(componentId)?.dataEventId;
                this.logger.log(`lockModuleOnMemoryEx: module not cached`, module);
                const record = diagnostics.lock("lockModuleOnMemoryEx", module, normalized, 1, "requested");
                this.resources.fetchResourceAsync(module, "lockModuleOnMemoryEx").then(() => {
                    if (dataEventId != null) {
                        const eid = this.resources.getDownloadComponentInfo(componentId)?.dataEventId;
                        if (eid != null && eid !== dataEventId) {
                            // ロック対象のESのデータイベントが更新された場合 -1 TR-B14 第二分冊 5.12.6.9 (6)
                            diagnostics.settleLock(record, "failed-after-request");
                            this.eventDispatcher.dispatchModuleLockedEvent(module, true, -1);
                            return;
                        }
                    }
                    const cachedModule = this.resources.lockCachedModule(componentId, moduleId, "lockModuleOnMemoryEx");
                    diagnostics.settleLock(record, cachedModule == null ? "failed-after-request" : "locked");
                    this.eventDispatcher.dispatchModuleLockedEvent(module, true, cachedModule == null ? -2 : 0);
                });
                return 1;
            }
            // イベントハンドラではモジュール名の大文字小文字がそのままである必要がある?
            diagnostics.lock("lockModuleOnMemoryEx", module, normalized, 1, "locked");
            this.eventDispatcher.dispatchModuleLockedEvent(module, true, 0);
            return 1;
        },
        lockScreen: () => {
            this.logger.debug(`lockScreen`);
            return 1;
        },
        getBrowserSupport: (sProvider, functionname, ...additionalinfoList) => {
            this.logger.log(`getBrowserSupport`, sProvider, functionname, ...additionalinfoList);
            const additionalinfo = additionalinfoList[0] ?? undefined;
            const additionalinfo2 = additionalinfoList[1] ?? undefined;
            const additionalinfo3 = additionalinfoList[2] ?? undefined;
            if (sProvider === "ARIB") {
                if (functionname === "BMLversion") {
                    if (additionalinfo == null) {
                        return 1;
                    }
                    else {
                        const [major, minor] = additionalinfo.split(".").map(x => Number.parseInt(x));
                        if (major == null || minor == null) {
                            return 0;
                        }
                        if ((major < 3 && major >= 0) || (major === 3 && minor === 0)) {
                            return 1;
                        }
                        return 0;
                    }
                }
                else if (functionname === "BXMLversion") {
                    // B-XML
                    return 0;
                }
                else if (functionname === "Storage" && additionalinfo === "cachesize") {
                    // filesizeのキャッシュを備えているかどうか
                    const filesize = Number(additionalinfo2);
                    // ひとまず10 MiB
                    return filesize * 1024 <= 1024 * 1024 * 10 ? 1 : 0;
                }
                else if (functionname === "AudioFile") {
                    // filesizeの音声ファイルを再生可能かどうか
                    const filesize = Number(additionalinfo);
                    // ひとまず10 MiB
                    return filesize <= 1024 * 1024 * 10 ? 1 : 0;
                }
                else if (functionname === "APIGroup" && additionalinfo === "Com.IP.confirmIP") {
                    return this.ip.confirmIPNetwork != null ? 1 : 0;
                }
                const f = arib.get(functionname);
                if (f == null) {
                    this.logger.error(`unknown getBrowserSupport functionname`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                // A few capabilities are answered by a constant (0/1) rather than a sub-key table;
                // calling .get() on those threw a TypeError straight into the page.
                if (typeof f === "number") {
                    return f;
                }
                const a1 = f.get(additionalinfo);
                if (a1 == null) {
                    this.logger.error(`unknown getBrowserSupport additionalinfo`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                if (typeof a1 === "number") {
                    return a1;
                }
                const a2 = a1.get(additionalinfo2);
                if (a2 == null) {
                    this.logger.error(`unknown getBrowserSupport additionalinfo2`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                if (typeof a2 === "number") {
                    return a2;
                }
                const a3 = a2.get(additionalinfo3);
                if (a3 == null) {
                    this.logger.error(`unknown getBrowserSupport additionalinfo2`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                return a3;
            }
            else if (sProvider === "BPA") {
                const f = bpa.get(functionname);
                if (f == null) {
                    this.logger.error(`unknown getBrowserSupport functionname`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                const a1 = f.get(additionalinfo);
                if (a1 == null) {
                    this.logger.error(`unknown getBrowserSupport additionalinfo`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                return a1;
            }
            else if (sProvider === "DPACpro") {
                // Cプロファイル
                if (functionname === "BMLversion") {
                    if (additionalinfo == null) {
                        // 12.0
                        return 1;
                    }
                    else {
                        const [major, minor] = additionalinfo.split(".").map(x => Number.parseInt(x));
                        if (major == null || minor == null) {
                            return 0;
                        }
                        if ((major < 12 && major >= 0) || (major === 12 && minor === 0)) {
                            return 1;
                        }
                        return 0;
                    }
                }
                else if (functionname === "Storage" && additionalinfo === "cachesize") {
                    // filesizeのキャッシュを備えているかどうか
                    const filesize = Number(additionalinfo2);
                    // ひとまず10 MiB
                    return filesize * 1024 <= 1024 * 1024 * 10 ? 1 : 0;
                }
                else if (functionname === "AudioFile") {
                    // filesizeの音声ファイルを再生可能かどうか
                    const filesize = Number(additionalinfo);
                    // ひとまず10 MiB
                    return filesize <= 1024 * 1024 * 10 ? 1 : 0;
                }
                const f = dpaCpro.get(functionname);
                if (f == null) {
                    this.logger.error(`unknown getBrowserSupport functionname`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                // Same constant-answer case as the `arib` table above.
                if (typeof f === "number") {
                    return f;
                }
                const a1 = f.get(additionalinfo);
                if (a1 == null) {
                    this.logger.error(`unknown getBrowserSupport additionalinfo`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                if (typeof a1 === "number") {
                    return a1;
                }
                const a2 = a1.get(additionalinfo2);
                if (a2 == null) {
                    this.logger.error(`unknown getBrowserSupport additionalinfo2`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                if (typeof a2 === "number") {
                    return a2;
                }
                const a3 = a2.get(additionalinfo3);
                if (a3 == null) {
                    this.logger.error(`unknown getBrowserSupport additionalinfo2`, sProvider, functionname, ...additionalinfoList);
                    return 0;
                }
                return a3;
            }
            this.logger.error(`unknown getBrowserSupport`, sProvider, functionname, ...additionalinfoList);
            return 0;
        },
        getBrowserStatus: (sProvider, statusname, additionalinfo) => {
            this.logger.log(`getBrowserStatus`, sProvider, statusname, additionalinfo);
            if (sProvider === "TerrP" || sProvider === "DPA" /* Cプロファイル */) {
                if (statusname === "IRDState") {
                    if (additionalinfo === "Link") {
                        // リンク状態のみ実装
                        return 1;
                    }
                    else if (additionalinfo === "UnLink") {
                        // リンク状態のみ実装
                        return 0;
                    }
                    else if (additionalinfo === "Broadcast") {
                        return this.resources.isInternetContent ? 0 : 1;
                    }
                }
            }
            this.logger.error(`unknown getBrowserStatus`, sProvider, statusname, additionalinfo);
            return NaN;
        },
        launchDocument: (documentName, transitionStyle) => {
            this.logger.log(`launchDocument`, documentName, transitionStyle);
            this.content.launchDocument(documentName).catch((e) => this.logger.error(`launchDocument failed`, documentName, e));
            // Reached on every launch/quit: this throw is how the page script is aborted, not an
            // impossible branch.
            throw new Error("document transition aborted the running script");
        },
        quitDocument: () => {
            this.logger.log(`quitDocument`);
            // Fire-and-forget like launchDocument beside it, but an unhandled rejection here was
            // invisible: nothing else records a failed quit.
            this.content.quitDocument().catch((e) => this.logger.error(`quitDocument failed`, e));
            // Reached on every launch/quit: this throw is how the page script is aborted, not an
            // impossible branch.
            throw new Error("document transition aborted the running script");
        },
        reloadActiveDocument: () => {
            this.logger.debug(`reloadActiveDocument`);
            return this.browser.launchDocument(this.browser.getActiveDocument());
        },
        launchExApp: (uriname, MIME_type, ...Ex_info) => {
            this.logger.log(`launchExApp`, { uriname, MIME_type, Ex_info });
            return NaN;
        },
        getFreeContentsMemory: (number_of_resource) => {
            return 10 * 1024 * 1024;
        },
        isSupportedMedia: (mediaName) => {
            switch (mediaName) {
                // BSデジタル放送
                case "1":
                    return 1;
                // 広帯域CSデジタル放送（右旋）
                case "2":
                    return 1;
                // 広帯域CSデジタル放送（左旋）
                case "3":
                    return 0;
                // 地上波デジタルテレビ放送
                case "4":
                    return 1;
                // 地上波デジタル音声放送
                case "5":
                    return 0;
                // 高度 BS デジタル放送
                case "6":
                    return 0;
                // 高度広帯域CSデジタル放送
                case "7":
                    return 0;
            }
            return 0;
        },
        readPersistentArray: (filename, structure) => {
            this.logger.debug(`readPersistentArray`, filename, structure);
            return this.nvram.readPersistentArray(filename, structure);
        },
        writePersistentArray: (filename, structure, data, period) => {
            this.logger.debug(`writePersistentArray`, filename, structure, data, period);
            return this.nvram.writePersistentArray(filename, structure, data, period);
        },
        checkAccessInfoOfPersistentArray: (filename) => {
            this.logger.debug(`checkAccessInfoOfPersistentArray`, filename);
            return this.nvram.checkAccessInfoOfPersistentArray(filename);
        },
        writePersistentArrayWithAccessCheck: (filename, structure, data, period) => {
            this.logger.debug(`writePersistentArrayWithAccessCheck`, filename, structure, data, period);
            return this.nvram.writePersistentArrayWithAccessCheck(filename, structure, data, period);
        },
        readPersistentArrayWithAccessCheck: (filename, structure) => {
            this.logger.debug(`readPersistentArrayWithAccessCheck`, filename, structure);
            return this.nvram.readPersistentArrayWithAccessCheck(filename, structure);
        },
        connect: (tel, ...args) => {
            return NaN;
        },
        disconnect: () => {
            return NaN;
        },
        sendTextData: (text, timeout) => {
            return NaN;
        },
        receiveTextData: (timeout) => {
            return null;
        },
        random(num) {
            return Math.floor(Math.random() * num) + 1;
        },
        getActiveDocument: () => {
            const activeDocument = this.resources.activeDocument;
            if (activeDocument == null) {
                return null;
            }
            // TR-B14 第二分冊 5.14.6.9
            if (activeDocument.startsWith("http://") || activeDocument.startsWith("https://")) {
                const url = new URL(activeDocument);
                return url.pathname + url.search + url.hash;
            }
            return activeDocument;
        },
        getResidentAppVersion: (appName) => {
            // Cプロファイルでもこの関数は運用される
            // ただしappNameにComBrowserは指定しない (TR-B14 第三分冊 7.10.6)
            this.logger.debug(`getResidentAppVersion`, appName);
            return null;
        },
        getLockedModuleInfo: () => {
            this.logger.debug(`getLockedModuleInfo`);
            const l = [];
            for (const { module, isEx, requesting } of this.resources.getLockedModules()) {
                l.push([module, isEx ? 2 : 1, requesting ? 2 : 1]);
            }
            return l;
        },
        detectComponent: (component_ref) => {
            const { componentId } = this.resources.parseURLEx(component_ref);
            if (componentId == null) {
                return NaN;
            }
            if (this.resources.getPMTComponent(componentId)) {
                this.logger.debug(`detectComponent`, componentId, true);
                return 1;
            }
            else {
                this.logger.debug(`detectComponent`, componentId, false);
                return 0;
            }
        },
        getProgramID: (type) => {
            function toHex(n, d) {
                if (n == null) {
                    return null;
                }
                return "0x" + n.toString(16).padStart(d, "0");
            }
            if (type == 1) {
                return toHex(this.resources.eventId, 4);
            }
            else if (type == 2) {
                return toHex(this.resources.serviceId, 4);
            }
            else if (type == 3) {
                return toHex(this.resources.originalNetworkId, 4);
            }
            else if (type == 4) {
                return toHex(this.resources.transportStreamId, 4);
            }
            else if (type == 6) {
                // STD-B24 第二分冊 (1/2) 9.2.6
                return this.resources.eventURI;
            }
            else if (type == 7) {
                // STD-B24 第二分冊 (1/2) 9.2.5
                return this.resources.serviceURI;
            }
            else if (type == 9) {
                return toHex(this.resources.networkId, 4);
            }
            this.logger.error(`getProgramID`, type);
            return null;
        },
        playRomSound: (soundID) => {
            this.logger.log(`playRomSound`, soundID);
            const groups = /^romsound:\/\/(?<soundID>\d+)$/.exec(soundID)?.groups;
            // 名前空間に一致しない識別子は再生せず失敗を返す
            if (groups == null) {
                return NaN;
            }
            return (0, romsound_1.playRomSound)(Number.parseInt(groups.soundID), this.audioNodeProvider.getAudioDestinationNode(), this.resources.audioOutput) ? 1 : NaN;
        },
        getBrowserVersion() {
            return ["BMLHTML", "BMLHTML", "001", "000"];
        },
        getTuningLinkageSource() {
            return "";
        },
        getTuningLinkageType() {
            return -1;
        },
        getIRDID: (type) => {
            this.logger.debug(`getIRDID`, type);
            // 5 (B-CAS card id) would be the 20-digit card number without its 5-char checksum,
            // converted to hex; no receiver here exposes one, so every type returns null.
            return null;
        },
        setISPParams: (ispname, tel, bProvider, uid, passwd, nameServer1, nameServer2, softCompression, headerCompression, idleTime, status, lineType) => {
            return NaN;
        },
        getISPParams: () => {
            return null;
        },
        connectPPP: (tel, bProvider, uid, passwd, nameServer1, nameServer2, softCompression, headerCompression, idleTime) => {
            return NaN;
        },
        connectPPPWithISPParams: (idleTime) => {
            return NaN;
        },
        disconnectPPP: () => {
            return NaN;
        },
        isIPConnected: () => {
            this.logger.debug(`isIPConnected`);
            return this.ip.isIPConnected?.() ?? 0;
        },
        getConnectionType: () => {
            this.logger.debug(`getConnectionType`);
            return this.ip.getConnectionType?.() ?? 403; // Ethernet DHCP
        },
        sendTextMail(subject, body, toAddress, ...ccAddress) {
            return [NaN, NaN];
        },
        sendMIMEMail(subject, src_module, toAddress, ...ccAddress) {
            return [NaN, NaN];
        },
        setCacheResourceOverIP: (resources) => {
            return 1;
        },
        getPrefixNumber: () => {
            return ["", "", "", "", ""];
        },
        vote: (tel, timeout) => {
            this.logger.log(`vote`, { tel, timeout });
            return NaN;
        },
        isRootCertificateExisting: (root_certificate_type, root_certificate_id, root_certificate_version) => {
            this.logger.debug(`isRootCertificateExisting stub`, { root_certificate_type, root_certificate_id, root_certificate_version });
            return 1;
        },
        getRootCertificateInfo: () => {
            this.logger.debug(`getRootCertificateInfo stub`);
            return [];
        },
        setInterval: (evalCode, msec, iteration) => {
            const handle = this.eventQueue.setInterval(() => {
                iteration--;
                if (iteration === 0) {
                    this.eventQueue.clearInterval(handle);
                }
                this.eventQueue.queueAsyncEvent(async () => {
                    return await this.eventQueue.executeEventHandler(evalCode);
                });
                this.eventQueue.processEventQueue();
            }, msec);
            this.logger.debug(`setInterval`, evalCode, msec, iteration, handle);
            return handle;
        },
        clearTimer: (timerID) => {
            this.logger.debug(`clearTimer`, timerID);
            return this.eventQueue.clearInterval(timerID) ? 1 : NaN;
        },
        pauseTimer: (timerID) => {
            this.logger.debug(`pauseTimer`, timerID);
            return this.eventQueue.pauseTimer(timerID) ? 1 : NaN;
        },
        resumeTimer: (timerID) => {
            this.logger.debug(`resumeTimer`, timerID);
            return this.eventQueue.resumeTimer(timerID) ? 1 : NaN;
        },
        getNPT: () => {
            const npt = Math.floor((this.content.getNPT90kHz() ?? NaN) / 90);
            this.logger.debug(`getNPT`, npt);
            return npt;
        },
        // Cプロファイル
        X_DPA_getComBrowserUA: () => {
            return [
                [
                    // メーカーID
                    // 2D: KDDI
                    // 2E: J-PHONE
                    // 2F: NTT DoCoMo
                    "00",
                    // User-Agent
                    ""
                ]
            ];
        },
        X_DPA_startResidentApp: (appName, showAV, returnURI, ...Ex_info) => {
            const hook = this.X_DPA_startResidentApp;
            if (hook != null) {
                return hook(String(appName), Number(showAV), String(returnURI), Ex_info.map(x => String(x)));
            }
            // ComBrowser and BookmarkList are the only resident apps the spec names here, and this
            // receiver implements neither, so every name answers with the failure value.
            return NaN;
        },
        X_DPA_getIRDID: (type) => {
            // 1 受信機固有識別子 / 2 視聴者固有識別子 / 3 either. This receiver exposes none of
            // them, so every type is the same null answer rather than a switch over constants.
            this.logger.debug(`X_DPA_getIRDID`, type);
            return null;
        },
        X_DPA_writeCproBM: (title, dstURI, outline, CproBMtype, expire) => {
            // テレビリンクの登録
            this.logger.error(`X_DPA_writeCproBM`, title, dstURI, outline, CproBMtype, expire);
            return NaN;
        },
        X_DPA_launchDocWithLink: (documentName) => {
            this.logger.log(`X_DPA_launchDocWithLink`, documentName);
            if (this.resources.profile !== profile_1.Profile.TrProfileC) {
                return NaN;
            }
            // 絶対 URI を使用すること (TR-B14 第三分冊 8.3.10.2)
            // http: / https: のいずれも可 (同 8.3.10.3)
            if (!documentName.startsWith("http://") && !documentName.startsWith("https://")) {
                return NaN;
            }
            if (!this.resources.isInternetContent) {
                // 放送受信状態で使われた場合失敗動作となる
                // エラーメッセージを表示すべき (8.3.11.4)
                this.content.quitDocument().catch((e) => this.logger.error(`quitDocument failed`, e));
                return NaN;
            }
            this.content.launchDocument(documentName, { withLink: true }).catch((e) => this.logger.error(`X_DPA_launchDocWithLink failed`, documentName, e));
            // Reached on every launch/quit: this throw is how the page script is aborted, not an
            // impossible branch.
            throw new Error("document transition aborted the running script");
        },
    };
    serviceId;
    onMessage(msg) {
        if (msg.type === "programInfo") {
            if (msg.serviceId != null && msg.serviceId !== this.serviceId) {
                // TR-B14 第二分冊 5.12.6.1
                if (this.serviceId != null) {
                    this.logger.log(`serviceId changed`, msg.serviceId, this.serviceId);
                    for (let i = 1; i < 64; i++) { // FIXME
                        this.setUreg(i, "");
                    }
                }
                this.serviceId = msg.serviceId;
                // C プロファイルでは Ureg[0] に service_id を設定しない
                if (this.resources.profile !== profile_1.Profile.TrProfileC) {
                    // TR-B14 第二分冊 5.12.6.1: service_id を "0xXXXX" 形式で書く
                    this.setUreg(0, "0x" + msg.serviceId.toString(16).padStart(4, "0"));
                }
                else {
                    this.setUreg(0, "");
                }
            }
        }
    }
}
exports.BrowserAPI = BrowserAPI;
//# sourceMappingURL=browser.js.map