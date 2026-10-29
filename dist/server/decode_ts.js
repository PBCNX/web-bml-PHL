"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyInfoMessages = emergencyInfoMessages;
exports.decodeTS = decodeTS;
const reader_js_1 = require("arib-mmt-tlv-ts/ts/reader.js");
const si_text_decoder_js_1 = require("arib-mmt-tlv-ts/ts/si-text-decoder.js");
const utils_js_1 = require("arib-mmt-tlv-ts/utils.js");
const time_offset_1 = require("../client/time_offset");
const pes_reader_js_1 = require("arib-mmt-tlv-ts/ts/pes-reader.js");
const fflate_1 = require("fflate");
const entity_parser_1 = require("../client/entity_parser");
var CompressionType;
(function (CompressionType) {
    CompressionType[CompressionType["None"] = -1] = "None";
    CompressionType[CompressionType["Zlib"] = 0] = "Zlib";
})(CompressionType || (CompressionType = {}));
/**
 * The EWBS messages one `emergency_information_descriptor` (tag 0xFC) yields.
 *
 * Split out of the reader so the mapping is testable without TS framing. The descriptor is a PMT
 * program_info descriptor — that is where PBCNX's injector writes it and where their end-to-end stream
 * carries it; an SDT hook never fires, which is how the first version of this went unnoticed.
 */
function emergencyInfoMessages(serviceId, descriptor) {
    // Another tag's descriptor also carries `services`, so narrow on the tag before reading them.
    const ewbs = descriptor;
    if (ewbs?.tag !== "emergencyInformation" || ewbs.services == null) {
        return [];
    }
    return ewbs.services.map((alert) => ({
        type: "emergencyInfo",
        serviceId,
        startEndFlag: alert.startEndFlag,
        signalLevel: alert.signalLevel,
        areaCodes: alert.areaCodes,
    }));
}
const utf8Decoder = new TextDecoder("utf-8");
let base64Table = [];
function toBase64(input) {
    // Node 25からなため
    if ("toBase64" in Uint8Array.prototype) {
        return input.toBase64();
    }
    if (base64Table.length === 0) {
        base64Table = Array.from({ length: 64 }).map((_, i) => globalThis.btoa(String.fromCharCode(i << 2)).charAt(0));
    }
    let result = "";
    for (let i = 0; i + 3 <= input.length; i += 3) {
        const t = (input[i] << 16) | (input[i + 1] << 8) | (input[i + 2]);
        result += base64Table[(t >> 18) & 63];
        result += base64Table[(t >> 12) & 63];
        result += base64Table[(t >> 6) & 63];
        result += base64Table[t & 63];
    }
    if (input.length % 3 === 1) {
        const t = input[input.length - 1] << 16;
        result += base64Table[(t >> 18) & 63];
        result += base64Table[(t >> 12) & 63];
        result += "==";
    }
    else if (input.length % 3 === 2) {
        const t = (input[input.length - 2] << 16) | (input[input.length - 1] << 8);
        result += base64Table[(t >> 18) & 63];
        result += base64Table[(t >> 12) & 63];
        result += base64Table[(t >> 6) & 63];
        result += "=";
    }
    return result;
}
function concatBuffers(buffers) {
    if (buffers.length === 1) {
        return buffers[0];
    }
    const total = buffers.reduce((p, c) => p + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const buffer of buffers) {
        result.set(buffer, offset);
        offset += buffer.length;
    }
    return result;
}
function decodeTS(options) {
    const reader = new reader_js_1.TSReader();
    const { sendCallback: send, serviceId: specifiedServiceId, parsePES } = options;
    const logger = options.logger ?? console;
    let pmtRetrieved = false;
    let pidToComponent = new Map();
    let componentToPid = new Map();
    let currentTime = null;
    let localTimeOffset = null;
    const downloadComponents = new Map();
    const cachedComponents = new Map();
    let currentProgramInfo = {
        type: "programInfo",
        eventId: null,
        transportStreamId: null,
        originalNetworkId: null,
        serviceId: null,
        eventName: null,
        startTimeUnixMillis: null,
        durationSeconds: null,
        indefiniteDuration: null,
        networkId: null,
    };
    // SDTのEIT_present_following_flag
    // key: service_id
    const eitPresentFollowingFlag = new Map();
    // program_number = service_id
    let pidToProgramNumber = new Map();
    let serviceId = specifiedServiceId ?? null;
    let pcrPID = null;
    // 字幕/文字スーパーのPESのPID
    let privatePes = new Set();
    let privatePesReaders = new Map();
    // ワンセグの場合0x1fc8-0x1fcfまでの固定PIDでPMTでワンセグのみを受信している場合PATは受信されない
    // ワンセグPMTを10回受信する間にPATが未受信であればワンセグだと判定
    let oneSegPMTCount = 0;
    let oneSeg = false;
    // The PMT repeats, so the same descriptor arrives several times a second; an alert is only news
    // when its state or areas change.
    const lastEmergencyInfo = new Map();
    let patRetrieved = false;
    reader.addEventListener("tot", ({ section }) => {
        const time = (0, utils_js_1.mjdBCDToUnixEpoch)(section.jstTime) * 1000;
        // C16: the stream's local time offset (PH is +8, Japan +9). A page's absolute times are in
        // the broadcast local time, so the client needs this instead of the old JST assumption.
        // GMA's TOT declares PHL with a zero offset, which is a declaration bug: the effective reader
        // answers +8:00 there instead of handing the client a clock eight hours out.
        const offset = (0, time_offset_1.effectiveStreamOffsetMinutes)(section.descriptors);
        if (currentTime !== time || localTimeOffset !== offset) {
            currentTime = time;
            localTimeOffset = offset;
            send({
                type: "currentTime",
                timeUnixMillis: currentTime,
                ...(offset != null ? { localTimeOffsetMinutes: offset } : {}),
            });
        }
    });
    reader.addEventListener("pat", ({ section }) => {
        patRetrieved = true;
        const pat = new Map();
        for (const program of section.programs) {
            if (program.type === "networkPID") {
                continue;
            }
            // 多重化されていればとりあえず一番最初のprogram_number使っておく
            pat.set(program.programMapPID, program.programNumber);
            serviceId ??= program.programNumber;
        }
        if (pat.size !== pidToProgramNumber.size || [...pidToProgramNumber.keys()].some((x) => !pat.has(x))) {
            logger.log("PAT changed", pat);
            if (specifiedServiceId != null && pat.size !== 1) {
                logger.warn("multiplexed!");
            }
            pmtRetrieved = false;
        }
        pidToProgramNumber = pat;
    });
    reader.addEventListener("pmt", ({ pid, section }) => {
        // 多重化されている
        if (!oneSeg && pidToProgramNumber.size !== 1) {
            if (pidToProgramNumber.size === 0 && pid === 0x1fc8 && !patRetrieved) {
                oneSegPMTCount++;
                if (oneSegPMTCount >= 10) {
                    oneSeg = true;
                    serviceId ??= section.programNumber;
                }
            }
        }
        if (section.programNumber !== serviceId) {
            return;
        }
        // EWBS: the emergency_information_descriptor is a program_info descriptor of the PMT (that is
        // where PBCNX's injector puts it and where captures carry it), and it names the areas an
        // alert covers. Without this the engine could decide relevance but never learn the areas.
        for (const programDescriptor of section.programInfo) {
            for (const message of emergencyInfoMessages(section.programNumber, programDescriptor)) {
                const key = `${message.startEndFlag}|${message.signalLevel}|${message.areaCodes.join(",")}`;
                if (lastEmergencyInfo.get(message.serviceId) !== key) {
                    lastEmergencyInfo.set(message.serviceId, key);
                    send(message);
                }
            }
        }
        const ptc = new Map();
        const ctp = new Map();
        privatePes.clear();
        for (const stream of section.streams) {
            if (parsePES && stream.streamType === 0x06) {
                privatePes.add(stream.elementaryPID);
            }
            const pid = stream.elementaryPID;
            let bxmlInfo;
            let componentId;
            let dataComponentId;
            for (const esInfo of stream.esInfo) {
                if (esInfo.tag == "streamIdentifier") { // Stream identifier descriptor ストリーム識別記述子
                    // PID => component_tagの対応
                    componentId = esInfo.componentTag;
                }
                else if (esInfo.tag == "dataComponent") { // Data component descriptor データ符号化方式記述子
                    dataComponentId = esInfo.dataComponentId;
                    // STD-B10 第2部 付録J 表J-1参照
                    if (dataComponentId == 0x0C || // 地上波
                        dataComponentId == 0x0D || // 地上波
                        dataComponentId == 0x07 || // BS
                        dataComponentId == 0x0B // CS
                    ) {
                        bxmlInfo = decodeAdditionalAribBXMLInfo(esInfo.additionalDataComponentInfo);
                    }
                }
            }
            if (componentId == null) {
                continue;
            }
            const componentPMT = {
                componentId,
                pid,
                bxmlInfo,
                streamType: stream.streamType,
                dataComponentId: dataComponentId,
            };
            ptc.set(pid, componentPMT);
            ctp.set(componentPMT.componentId, componentPMT);
        }
        updateProgramInfo({
            serviceId,
        });
        pcrPID = section.pcrPID;
        pidToComponent = ptc;
        if (!pmtRetrieved || componentToPid.size !== ctp.size || [...componentToPid.keys()].some((x) => !ctp.has(x))) {
            // PMTが変更された
            componentToPid = ctp;
            pmtRetrieved = true;
            const msg = {
                type: "pmt",
                components: [...componentToPid.values()]
            };
            send(msg);
        }
    });
    reader.addEventListener("packet", ({ packet }) => {
        if (packet.transportErrorIndicator) {
            return;
        }
        if (privatePes.has(packet.pid)) {
            const reader = privatePesReaders.get(packet.pid) ?? new pes_reader_js_1.PESReader();
            privatePesReaders.set(packet.pid, reader);
            for (const data of reader.pushPacket(packet)) {
                const msg = decodePES(data);
                if (msg != null) {
                    send(msg);
                }
            }
        }
        if (packet.pid !== pcrPID) {
            return;
        }
        if (packet.adaptationFieldControl !== 2 && packet.adaptationFieldControl !== 3) {
            return;
        }
        const adaptationFieldLength = packet.data[4];
        if (adaptationFieldLength < 1 + 6) {
            return;
        }
        const pcrFlag = !!(packet.data[5] & 16);
        if (!pcrFlag) {
            return;
        }
        let pcrBase = 0;
        pcrBase += packet.data[6] * 0x01000000 * 2;
        pcrBase += packet.data[7] * 0x00010000 * 2;
        pcrBase += packet.data[8] * 0x00000100 * 2;
        pcrBase += packet.data[9] * 0x00000001 * 2;
        pcrBase += packet.data[10] & 0x80 ? 1 : 0;
        const pcrExtension = ((packet.data[10] & 1) << 8) | packet.data[11];
        send({
            type: "pcr",
            pcrBase,
            pcrExtension,
        });
    });
    reader.addEventListener("bit", ({ section }) => {
        // data.first_descriptorsはSI伝送記述子のみ
        // 地上波だとbroadcaster_idは255
        const broadcasters = [];
        for (const descriptor of section.broadcasters) {
            let broadcaster_id = descriptor.broadcasterId;
            const broadcasterNameDescriptor = descriptor.broadcasterDescriptors.find((x) => x.tag === "broadcasterName");
            const broadcasterName = broadcasterNameDescriptor?.name == null ? null : (0, si_text_decoder_js_1.decodeSIText)(broadcasterNameDescriptor?.name);
            const serviceListDescriptor = descriptor.broadcasterDescriptors.find((x) => x.tag === "serviceList");
            const extendedBroadcasterDescriptor = descriptor.broadcasterDescriptors.find((x) => x.tag === "extendedBroadcaster");
            const terDescriptor = extendedBroadcasterDescriptor?.broadcasterType === "terrestrial" ? extendedBroadcasterDescriptor : undefined;
            const affiliations = terDescriptor?.affiliationIdList ?? [];
            const affiliationBroadcasters = terDescriptor?.broadcasters ?? [];
            const services = serviceListDescriptor?.services ?? [];
            if (broadcaster_id === 255) {
                // broadcaster_id = extendedBroadcasterDescriptor?.terrestrial_broadcaster_id ?? broadcaster_id;
            }
            const broadcaster = {
                affiliations,
                broadcasterId: broadcaster_id,
                broadcasterName,
                affiliationBroadcasters: affiliationBroadcasters,
                services,
                terrestrialBroadcasterId: terDescriptor?.terrestrialBroadcasterId,
            };
            broadcasters.push(broadcaster);
        }
        const msg = {
            type: "bit",
            broadcasters,
            originalNetworkId: section.originalNetworkId,
        };
        send(msg);
    });
    function updateProgramInfo(info) {
        for (const key of Object.keys(currentProgramInfo)) {
            if (key in info) {
                if (info[key] !== currentProgramInfo[key]) {
                    currentProgramInfo = {
                        ...currentProgramInfo,
                        ...info,
                    };
                    send(currentProgramInfo);
                    return;
                }
            }
        }
    }
    reader.addEventListener("eit", ({ pid, section }) => {
        if (oneSeg && pid !== 0x0027) { // L-EIT
            return;
        }
        else if (!oneSeg && pid !== 0x0012) { // H-EIT
            return;
        }
        if (currentProgramInfo.originalNetworkId !== section.originalNetworkId || section.serviceId !== serviceId) {
            return;
        }
        if (!section.currentNextIndicator) {
            return;
        }
        if (section.tableId !== "EIT[p/f]" || section.other) { // 自TS, 現在/次のイベント情報
            return;
        }
        if (section.sectionNumber !== 0) { // 現在のイベント情報かどうか
            return;
        }
        if (section.events.length !== 1) {
            return;
        }
        const event = section.events[0];
        const eventId = event.eventId;
        // STD-B10: duration全ビット1 (0xFFFFFF)は継続時間未定
        // そのときdecodeTime()はBCDとして[165,165,165]になりdurationSecondsは巨大な値になる
        // browser.epgGetEventDurationは未定時の戻り値が仕様上定められていないため、
        // durationSecondsはそのまま残し、未定であることだけindefiniteDurationで伝える
        const durationSeconds = (0, utils_js_1.bcdTimeToSeconds)(event.duration ?? 0xffffff);
        const indefiniteDuration = event.duration == null;
        const startTimeUnixMillis = event.startTime == null ? null : (0, utils_js_1.mjdBCDToUnixEpoch)(event.startTime) * 1000;
        const shortEvent = event.descriptors.find(x => x.tag === "shortEvent"); // 短形式イベント記述子
        const eventName = shortEvent == null ? null : (0, si_text_decoder_js_1.decodeSIText)(shortEvent.eventName);
        updateProgramInfo({
            eventId,
            eventName,
            startTimeUnixMillis,
            durationSeconds,
            indefiniteDuration,
        });
    });
    reader.addEventListener("nit", ({ section }) => {
        if (section.tableId === "NIT[actual]") {
            updateProgramInfo({
                networkId: section.networkId,
            });
        }
    });
    reader.addEventListener("sdt", ({ section }) => {
        if (section.tableId === "SDT[actual]") { // 自ストリームのSDT
            eitPresentFollowingFlag.clear();
            for (const service of section.services) {
                eitPresentFollowingFlag.set(service.serviceId, service.eitPresentFollowingFlag);
                for (const descriptor of service.descriptors) {
                    if (descriptor.tag === "service") { // 0x48 サービス記述子
                    }
                }
            }
            updateProgramInfo({
                originalNetworkId: section.originalNetworkId,
                transportStreamId: section.transportStreamId
            });
        }
    });
    reader.addEventListener("sit", ({ section }) => {
        const service = section.services.find((service) => service.serviceId === serviceId);
        if (service == null) {
            return;
        }
        const shortEventDescriptor = service.descriptors.find((desc) => desc.tag === "shortEvent");
        const eventName = shortEventDescriptor == null ? null : (0, si_text_decoder_js_1.decodeSIText)(shortEventDescriptor.eventName);
        const networkId = section.transmissionInfoDescriptors.find((desc) => desc.tag === "networkIdentification")?.networkId;
        let transportStreamId = null;
        let eventId = null;
        let durationSeconds = null;
        let indefiniteDuration = null;
        const transmissionTime = section.transmissionInfoDescriptors.find((desc) => desc.tag === "partialTSTime");
        const serviceTime = service.descriptors.find((desc) => desc.tag === "partialTSTime");
        // JSTはjst_time_flag=1のときだけ有効なので、フラグ付きを1st→2ndの順で探す
        const bcdJSTTime = transmissionTime?.jstTime ?? serviceTime?.jstTime;
        const jstTime = bcdJSTTime == null ? null : (0, utils_js_1.mjdBCDToUnixEpoch)(bcdJSTTime) * 1000;
        // event_start_timeは2nd loopでのみ有効
        let startTimeUnixMillis = null;
        if (serviceTime != null) {
            if (serviceTime.eventStartTime != null) {
                startTimeUnixMillis = (0, utils_js_1.mjdBCDToUnixEpoch)(serviceTime.eventStartTime) * 1000;
            }
            durationSeconds = (0, utils_js_1.bcdTimeToSeconds)(serviceTime.duration ?? 0xffffff);
            indefiniteDuration = serviceTime.duration == null;
        }
        const broadcastIdDescriptor = service.descriptors.find((desc) => desc.tag === "broadcastId");
        let originalNetworkId = networkId ?? null;
        if (broadcastIdDescriptor != null) {
            originalNetworkId = broadcastIdDescriptor.originalNetworkId;
            transportStreamId = broadcastIdDescriptor.transportStreamId;
            eventId = broadcastIdDescriptor.eventId;
        }
        updateProgramInfo({
            networkId,
            originalNetworkId,
            transportStreamId,
            eventId,
            eventName,
            startTimeUnixMillis,
            durationSeconds,
            indefiniteDuration,
        });
        if (jstTime != null && currentTime !== jstTime) {
            currentTime = jstTime;
            send({
                type: "currentTime",
                timeUnixMillis: currentTime,
            });
        }
    });
    reader.addEventListener("dsmcc", ({ pid, section }) => {
        const c = pidToComponent.get(pid);
        if (c == null) {
            return;
        }
        const { componentId, bxmlInfo } = c;
        if (section.tableId === "DII") {
            // DII
            const transationIdLow2byte = section.tableIdExtension;
            const sectionNumber = section.sectionNumber;
            const lastSectionNumber = section.lastSectionNumber;
            // dsmccMessageHeader
            // protocolDiscriminatorは常に0x11
            // dsmccTypeは常に0x03
            // messageIdは常に0x1002
            const downloadId = section.downloadId;
            // downloadIdの下位28ビットは常に1で運用される
            const dataEventId = (downloadId >> 28) & 15;
            const modules = new Map();
            const transactionId = section.dsmccMessageHeader.transactionId;
            if (downloadComponents.get(componentId)?.transactionId === section.dsmccMessageHeader.transactionId) {
                return;
            }
            const componentInfo = {
                componentId,
                modules,
                transactionId,
                downloadedModuleCount: 0,
                dataEventId,
            };
            // blockSizeは常に4066
            const blockSize = section.blockSize;
            // windowSize, ackPeriod, tCDownloadWindowは常に0
            // privateDataは運用しない
            // 0<=numberOfModules<=64で運用
            // moduleSize<=256KB
            // compatibilityDescriptorは運用しない
            for (const module of section.modules) {
                const moduleId = module.moduleId;
                const moduleVersion = module.moduleVersion;
                const moduleSize = module.moduleSize;
                const moduleInfo = {
                    compressionType: CompressionType.None,
                    moduleId,
                    moduleVersion,
                    moduleSize,
                    blocks: new Array(Math.ceil(moduleSize / blockSize)),
                    downloadedBlockCount: 0,
                    dataEventId: dataEventId,
                };
                modules.set(moduleId, moduleInfo);
                for (const info of module.moduleInfoDescriptors) {
                    // Type記述子, ダウンロード推定時間記述子, Compression Type記述子のみ運用される(TR-B14 第三分冊 4.2.4 表4-4参照)
                    if (info.tag === "type") { // Type記述子 STD-B24 第三分冊 第三編 6.2.3.1
                        const contentType = utf8Decoder.decode(info.text);
                        moduleInfo.contentType = contentType;
                    }
                    else if (info.tag === "estDownloadTime") { // ダウンロード推定時間記述子 STD-B24 第三分冊 第三編 6.2.3.6
                    }
                    else if (info.tag === "compressionType") { // Compression Type記述子 STD-B24 第三分冊 第三編 6.2.3.9
                        moduleInfo.originalSize = info.originalSize;
                        moduleInfo.compressionType = info.compressionType;
                    }
                }
            }
            let returnToEntryFlag;
            for (const descriptor of section.privateDataDescriptors) {
                // arib_bxml_privatedata_descriptor
                // STD-B24 第二分冊 (1/2) 第二編 9.3.4参照
                if (descriptor.tag === "aribBxmlPrivateData") {
                    returnToEntryFlag = descriptor.returnToEntryFlag;
                }
            }
            const cachedComponent = cachedComponents.get(componentId);
            if (downloadComponents.get(componentId)?.dataEventId !== componentInfo.dataEventId && cachedComponent != null) {
                cachedComponent.modules.clear();
            }
            send({
                type: "moduleListUpdated",
                componentId,
                modules: section.modules.map((x) => ({ id: x.moduleId, version: x.moduleVersion, size: x.moduleSize })),
                dataEventId: dataEventId,
                returnToEntryFlag,
            });
            downloadComponents.set(componentId, componentInfo);
        }
        else if (section.tableId === "DDB") {
            if (bxmlInfo == null) {
                return;
            }
            const componentInfo = downloadComponents.get(componentId);
            if (componentInfo == null) {
                return;
            }
            // DDB
            const headerModuleId = section.moduleId;
            const headerModuleVersionLow5bit = section.versionNumber;
            const headerBlockNumberLow8bit = section.sectionNumber;
            // dsmccMessageHeader
            // protocolDiscriminatorは常に0x11
            // dsmccTypeは常に0x03
            // messageIdは常に0x1002
            const downloadId = section.dsmccDownloadDataHeader.downloadId;
            // downloadIdの下位28ビットは常に1で運用される
            const data_event_id = (downloadId >> 28) & 15;
            const moduleId = section.moduleId;
            const moduleVersion = section.moduleVersion;
            const blockNumber = section.blockNumber;
            const moduleInfo = componentInfo.modules.get(moduleId);
            if (moduleInfo == null) {
                return;
            }
            if (moduleInfo.moduleVersion !== moduleVersion) {
                return;
            }
            if (moduleInfo.dataEventId !== data_event_id) {
                return;
            }
            if (moduleInfo.blocks == null || moduleInfo.blocks.length <= blockNumber) {
                return;
            }
            if (moduleInfo.blocks[blockNumber] != null) {
                return;
            }
            moduleInfo.blocks[blockNumber] = section.blockData;
            moduleInfo.downloadedBlockCount++;
            if (moduleInfo.downloadedBlockCount >= moduleInfo.blocks.length) {
                componentInfo.downloadedModuleCount++;
                const cachedComponent = cachedComponents.get(componentId) ?? {
                    modules: new Map(),
                };
                const cachedModule = {
                    downloadModuleInfo: moduleInfo,
                    dataEventId: data_event_id,
                };
                let moduleData = concatBuffers(moduleInfo.blocks);
                moduleInfo.blocks = undefined;
                const previousCachedModule = cachedComponent.modules.get(moduleInfo.moduleId);
                if (previousCachedModule != null && previousCachedModule.downloadModuleInfo.moduleVersion === moduleInfo.moduleVersion && previousCachedModule.dataEventId === moduleInfo.dataEventId) {
                    // 更新されていない
                    return;
                }
                if (moduleInfo.compressionType === CompressionType.Zlib) {
                    try {
                        moduleData = (0, fflate_1.unzlibSync)(moduleData);
                    }
                    catch (e) {
                        // A corrupt module is dropped; the carousel offers it again.
                        logger.error("failed to inflate module", moduleInfo.moduleId, e);
                        return;
                    }
                }
                const mediaType = moduleInfo.contentType == null ? null : (0, entity_parser_1.parseMediaTypeFromString)(moduleInfo.contentType).mediaType;
                if (mediaType == null || (mediaType.type === "multipart" && mediaType.subtype === "mixed")) {
                    const parser = new entity_parser_1.EntityParser(moduleData);
                    let mod = null;
                    try {
                        mod = parser.readEntity();
                    }
                    catch (e) {
                        // The stream is not trusted: one bad module must not abort the demuxer.
                        logger.error("failed to parse module", moduleInfo.moduleId, e);
                        return;
                    }
                    if (mod?.multipartBody == null) {
                        logger.error("failed to parse module");
                    }
                    else {
                        const files = new Map();
                        for (const entity of mod.multipartBody) {
                            const location = entity.headers.find(x => x.name === "content-location");
                            if (location == null) { // 必ず含む
                                logger.error("failed to find Content-Location");
                                continue;
                            }
                            const contentType = entity.headers.find(x => x.name === "content-type");
                            if (contentType == null) { // 必ず含む
                                logger.error("failed to find Content-Type");
                                continue;
                            }
                            const mediaType = (0, entity_parser_1.parseMediaType)(contentType.value);
                            if (mediaType.mediaType == null) {
                                logger.error("failed to parse Content-Type", (0, entity_parser_1.entityHeaderToString)(contentType));
                                continue;
                            }
                            if (mediaType.error) {
                                logger.warn("failed to parse Content-Type", (0, entity_parser_1.entityHeaderToString)(contentType));
                            }
                            const locationString = (0, entity_parser_1.entityHeaderToString)(location);
                            files.set(locationString, {
                                contentLocation: locationString,
                                contentType: mediaType.mediaType,
                                data: entity.body,
                            });
                        }
                        cachedModule.files = files;
                        send({
                            type: "moduleDownloaded",
                            componentId,
                            moduleId,
                            files: [...files.values()].map(x => ({
                                contentType: x.contentType,
                                contentLocation: x.contentLocation,
                                dataBase64: toBase64(x.data),
                            })),
                            version: moduleVersion,
                            dataEventId: data_event_id,
                        });
                    }
                }
                else {
                    const files = new Map();
                    files.set(null, {
                        contentLocation: null,
                        contentType: mediaType,
                        data: moduleData,
                    });
                    cachedModule.files = files;
                    send({
                        type: "moduleDownloaded",
                        componentId,
                        moduleId,
                        files: [...files.values()].map(x => ({
                            contentType: x.contentType,
                            contentLocation: x.contentLocation,
                            dataBase64: toBase64(x.data),
                        })),
                        version: moduleVersion,
                        dataEventId: data_event_id,
                    });
                }
                cachedComponent.modules.set(moduleInfo.moduleId, cachedModule);
                cachedComponents.set(componentId, cachedComponent);
            }
        }
        else if (section.tableId === "streamDescriptor") {
            // ストリーム記述子
            const events = [];
            for (const descriptor of section.streamDescriptors) {
                if (descriptor.tag === "nptReference") { // NPT参照記述子 NPTReferenceDescriptor
                    events.push({
                        type: "nptReference",
                        postDiscontinuityIndicator: !!descriptor.postDiscontinuityIndicator,
                        dsmContentId: descriptor.dsmContentId,
                        STCReference: descriptor.stcReference,
                        NPTReference: descriptor.nptReference,
                        scaleNumerator: descriptor.scaleNumerator,
                        scaleDenominator: descriptor.scaleDenominator,
                    });
                }
                else if (descriptor.tag === "generalEvent") { // 汎用イベントメッセージ記述子 General_event_descriptor
                    // 0x00と0x02のみが運用される(TR-B14, TR-B15)
                    if (descriptor.time.timeMode === "immediate") {
                        events.push({
                            type: "immediateEvent",
                            eventMessageType: descriptor.eventMessageType,
                            eventMessageGroupId: descriptor.eventMessageGroupId,
                            eventMessageId: descriptor.eventMessageId,
                            privateDataByte: Array.from(descriptor.privateData),
                            timeMode: 0,
                        });
                    }
                    else if (descriptor.time.timeMode === "MJD" || descriptor.time.timeMode === "MJDStreamTime") {
                        // event_msg_MJD_JST_time
                    }
                    else if (descriptor.time.timeMode === "NPT") {
                        events.push({
                            type: "nptEvent",
                            eventMessageType: descriptor.eventMessageType,
                            eventMessageNPT: descriptor.time.eventMessageNPT,
                            eventMessageGroupId: descriptor.eventMessageGroupId,
                            eventMessageId: descriptor.eventMessageId,
                            privateDataByte: Array.from(descriptor.privateData),
                            timeMode: 2,
                        });
                    }
                    else if (descriptor.time.timeMode === "relative") {
                        // 4bit reserved_future_use
                        // 36bit event_msg_relativeTime
                    }
                }
            }
            send({
                type: "esEventUpdated",
                events,
                componentId,
                dataEventId: section.dataEventId,
            });
        }
    });
    return reader;
}
function decodeAdditionalAribBXMLInfo(additional_data_component_info) {
    let off = 0;
    // 地上波についてはTR-B14 第二分冊 2.1.4 表2-3を参照
    // BSについてはTR-B15 第一分冊 5.1.5 表5-4を参照
    // BS, CSについてはTR-B15 第四分冊 5.1.5 表5-4を参照
    // 00: データカルーセル伝送方式およびイベントメッセージ伝送方式 これのみが運用される
    // 01: データカルーセル伝送方式(蓄積専用データサービス)
    const transmission_format = ((additional_data_component_info[off] & 0b11000000) >> 6) & 0b11;
    // component_tag=0x40のとき必ず1となる
    // startup.xmlが最初に起動される (STD-B24 第二分冊 (1/2) 第二編 9.2.2参照)
    const entry_point_flag = ((additional_data_component_info[off] & 0b00100000) >> 5) & 0b1;
    const bxmlInfo = {
        transmissionFormat: transmission_format,
        entryPointFlag: !!entry_point_flag,
    };
    // STD-B24 第二分冊 (1/2) 第二編 9.3参照
    if (entry_point_flag) {
        // 運用
        const auto_start_flag = ((additional_data_component_info[off] & 0b00010000) >> 4) & 0b1;
        // 以下が運用される
        // 0011: 960x540 (16:9)
        // 0100: 640x480 (16:9)
        // 0101: 640x480 (4:3)
        // 以下は仕様のみ
        // 0000: 混在
        // 0001: 1920x1080 (16:9)
        // 0010: 1280x720 (16:9)
        // 0110: 320x240 (4:3)
        // 1111: 指定しない (Cプロファイルでのみ運用)
        const document_resolution = ((additional_data_component_info[off] & 0b00001111) >> 0) & 0b1111;
        off++;
        // 0のみが運用される
        const use_xml = ((additional_data_component_info[off] & 0b10000000) >> 7) & 0b1;
        // 地上波, CSでは0のみが運用される
        // BSでは1(bml_major_version=1, bml_minor_version=0)が指定されることもある
        const default_version_flag = ((additional_data_component_info[off] & 0b01000000) >> 6) & 0b1;
        // 地上波では1のみ運用, BS/CSの場合1の場合単独視聴可能, 0の場合単独視聴不可
        const independent_flag = ((additional_data_component_info[off] & 0b00100000) >> 5) & 0b1;
        // 運用される
        const style_for_tv_flag = ((additional_data_component_info[off] & 0b00010000) >> 4) & 0b1;
        // reserved
        off++;
        bxmlInfo.entryPointInfo = {
            autoStartFlag: !!auto_start_flag,
            documentResolution: document_resolution,
            useXML: !!use_xml,
            defaultVersionFlag: !!default_version_flag,
            independentFlag: !!independent_flag,
            styleForTVFlag: !!style_for_tv_flag,
            bmlMajorVersion: 1,
            bmlMinorVersion: 0,
        };
        // BSではbml_major_versionは1
        // CSではbml_major_versionは2
        // 地上波ではbml_major_versionは3
        if (default_version_flag === 0) {
            let bml_major_version = additional_data_component_info[off] << 8;
            off++;
            bml_major_version |= additional_data_component_info[off];
            bxmlInfo.entryPointInfo.bmlMajorVersion = bml_major_version;
            off++;
            let bml_minor_version = additional_data_component_info[off] << 8;
            off++;
            bml_minor_version |= additional_data_component_info[off];
            bxmlInfo.entryPointInfo.bmlMinorVersion = bml_minor_version;
            off++;
            // 運用されない
            if (use_xml == 1) {
                let bxml_major_version = additional_data_component_info[off] << 8;
                off++;
                bxml_major_version |= additional_data_component_info[off];
                bxmlInfo.entryPointInfo.bxmlMajorVersion = bxml_major_version;
                off++;
                let bxml_minor_version = additional_data_component_info[off] << 8;
                off++;
                bxml_minor_version |= additional_data_component_info[off];
                bxmlInfo.entryPointInfo.bxmlMinorVersion = bxml_minor_version;
                off++;
            }
        }
    }
    else {
        // reserved
        off++;
    }
    if (transmission_format === 0) {
        // additional_arib_carousel_info (STD-B24 第三分冊 第三編 C.1)
        // 常に0xF
        const data_event_id = ((additional_data_component_info[off] & 0b11110000) >> 4) & 0b1111;
        // 常に1
        const event_section_flag = ((additional_data_component_info[off] & 0b00001000) >> 3) & 0b1;
        //reserved
        off++;
        // 地上波ならば常に1, BS/CSなら1/0
        const ondemand_retrieval_flag = ((additional_data_component_info[off] & 0b10000000) >> 7) & 0b1;
        // 地上波ならば常に0, BS/CSなら/-
        const file_storable_flag = ((additional_data_component_info[off] & 0b01000000) >> 6) & 0b1;
        // 運用
        const start_priority = ((additional_data_component_info[off] & 0b00100000) >> 5) & 0b1;
        bxmlInfo.additionalAribCarouselInfo = {
            dataEventId: data_event_id,
            eventSectionFlag: !!event_section_flag,
            ondemandRetrievalFlag: !!ondemand_retrieval_flag,
            fileStorableFlag: !!file_storable_flag,
            startPriority: start_priority,
        };
        // reserved
        off++;
    }
    else if (transmission_format == 1) {
        // reserved
        off++;
    }
    return bxmlInfo;
}
function decodePES(pes) {
    let pos = 0;
    if (pes.length < 5) {
        return null;
    }
    if (pes[0] !== 0 || pes[1] !== 0 || pes[2] !== 1) {
        return null;
    }
    const view = new DataView(pes.buffer, pes.byteOffset, pes.byteLength);
    pos += 3;
    const streamId = view.getUint8(pos);
    pos++;
    const pesPacketLength = view.getUint16(pos);
    pos += 2;
    if (streamId === 0xBF) {
        return {
            type: "pes",
            data: Array.from(pes.subarray(pos, pos + pesPacketLength)),
            streamId
        };
    }
    if (streamId === 0xBE) {
        return null;
    }
    if ((pes[pos] >> 6) !== 0b10) {
        return null;
    }
    const scramblingControl = (pes[pos] >> 4) & 0b11;
    const priority = (pes[pos] >> 3) & 0b1;
    const dataAlignmentIndicator = (pes[pos] >> 2) & 0b1;
    const copyright = (pes[pos] >> 1) & 0b1;
    const original = (pes[pos] >> 0) & 0b1;
    pos++;
    const ptsDTSIndicator = (pes[pos] >> 6) & 0b11;
    const escrFlag = (pes[pos] >> 5) & 0b1;
    const esRateFlag = (pes[pos] >> 4) & 0b1;
    const dsmTrickModeFlag = (pes[pos] >> 3) & 0b1;
    const additionalCopyInfoFlag = (pes[pos] >> 2) & 0b1;
    const crcFlag = (pes[pos] >> 1) & 0b1;
    const extensionFlag = (pes[pos] >> 0) & 0b1;
    pos++;
    const pesHeaderLength = pes[pos];
    pos++;
    const dataPos = pos + pesHeaderLength;
    let pts;
    if (ptsDTSIndicator === 0b10 || ptsDTSIndicator === 0b11) {
        const pts3230 = (pes[pos] >> 1) & 0b111;
        pos++;
        const pts2915 = view.getUint16(pos) >> 1;
        pos += 2;
        const pts1400 = view.getUint16(pos) >> 1;
        pos += 2;
        pts = pts1400 + (pts2915 << 15) + (pts3230 * 0x40000000);
    }
    return {
        type: "pes",
        data: Array.from(pes.subarray(dataPos)),
        pts,
        streamId
    };
}
//# sourceMappingURL=decode_ts.js.map