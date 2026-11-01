/**
 * One service's emergency warning, from the emergency_information_descriptor (EWBS). The area codes
 * are the ARIB allocation: compare a receiver's code with `areaCovers()`/`areaRelevant()` from
 * `web-bml` to decide whether the alert concerns this viewer.
 */
export type EmergencyInfoMessage = {
    type: "emergencyInfo";
    serviceId: number;
    /** true while the alert is starting, false while it is ending. */
    startEndFlag: boolean;
    /** The service's signal level while the alert runs. */
    signalLevel: boolean;
    areaCodes: number[];
};
export type ComponentPMT = {
    pid: number;
    componentId: number;
    bxmlInfo?: AdditionalAribBXMLInfo;
    streamType: number;
    dataComponentId?: number;
};
export type AdditionalAribBXMLInfo = {
    transmissionFormat: number;
    entryPointFlag: boolean;
    entryPointInfo?: AdditionalAribBXMLEntryPointInfo;
    additionalAribCarouselInfo?: AdditionalAribCarouselInfo;
};
export type AdditionalAribBXMLEntryPointInfo = {
    autoStartFlag: boolean;
    documentResolution: number;
    useXML: boolean;
    defaultVersionFlag: boolean;
    independentFlag: boolean;
    styleForTVFlag: boolean;
    bmlMajorVersion: number;
    bmlMinorVersion: number;
    bxmlMajorVersion?: number;
    bxmlMinorVersion?: number;
};
export type AdditionalAribCarouselInfo = {
    dataEventId: number;
    eventSectionFlag: boolean;
    ondemandRetrievalFlag: boolean;
    fileStorableFlag: boolean;
    startPriority: number;
};
export type PMTMessage = {
    type: "pmt";
    components: ComponentPMT[];
};
import type { MediaType } from "./media_type";
export type { MediaType };
export type ModuleFile = {
    contentLocation: string | null;
    contentType: MediaType;
    dataBase64: string;
};
export type ModuleDownloadedMessage = {
    type: "moduleDownloaded";
    componentId: number;
    moduleId: number;
    files: ModuleFile[];
    version: number;
    dataEventId: number;
};
export type ModuleListEntry = {
    id: number;
    version: number;
    size: number;
};
export type ModuleListUpdatedMessage = {
    type: "moduleListUpdated";
    componentId: number;
    modules: ModuleListEntry[];
    dataEventId: number;
    returnToEntryFlag?: boolean;
};
export type ESEvent = ESImmediateEvent | ESNPTEvent | NPTReference;
export type ESImmediateEvent = {
    type: "immediateEvent";
    eventMessageGroupId: number;
    timeMode: 0;
    eventMessageType: number;
    eventMessageId: number;
    privateDataByte: number[];
};
export type ESNPTEvent = {
    type: "nptEvent";
    eventMessageGroupId: number;
    timeMode: 2;
    eventMessageNPT: number;
    eventMessageType: number;
    eventMessageId: number;
    privateDataByte: number[];
};
export type NPTReference = {
    type: "nptReference";
    postDiscontinuityIndicator: boolean;
    dsmContentId: number;
    STCReference: number;
    NPTReference: number;
    scaleNumerator: number;
    scaleDenominator: number;
};
export type ESEventUpdatedMessage = {
    type: "esEventUpdated";
    componentId: number;
    events: ESEvent[];
    dataEventId: number;
};
export type ProgramInfoMessage = {
    type: "programInfo";
    originalNetworkId: number | null;
    transportStreamId: number | null;
    serviceId: number | null;
    eventId: number | null;
    eventName: string | null;
    startTimeUnixMillis: number | null;
    durationSeconds: number | null;
    indefiniteDuration: boolean | null;
    networkId: number | null;
};
export type CurrentTime = {
    type: "currentTime";
    timeUnixMillis: number;
    /**
     * C16: the stream's local-time offset from UTC in minutes, from the TOT's local_time_offset
     * descriptor (PH +480, Japan +540). Absent when the stream carries no descriptor; the client then
     * falls back to JST.
     */
    localTimeOffsetMinutes?: number;
};
export type VideoStreamUrlMessage = {
    type: "videoStreamUrl";
    videoStreamUrl: string;
};
export type ErrorMessage = {
    type: "error";
    message: string;
};
export type BITExtendedBroadcaster = {
    originalNetworkId: number;
    broadcasterId: number;
};
export type BITService = {
    serviceType: number;
    serviceId: number;
};
export type BITBroadcaster = {
    broadcasterId: number;
    broadcasterName: string | null;
    services: BITService[];
    affiliations: number[];
    affiliationBroadcasters: BITExtendedBroadcaster[];
    terrestrialBroadcasterId?: number;
};
export type BITMessage = {
    type: "bit";
    originalNetworkId: number;
    broadcasters: BITBroadcaster[];
};
export type PCRMessage = {
    type: "pcr";
    pcrBase: number;
    pcrExtension: number;
};
export type PESMessage = {
    type: "pes";
    streamId: number;
    pts?: number;
    data: number[];
};
/**
 * The audio codec the engine sniffed from the first payload bytes of an audio component, once.
 *
 * PH broadcasters mislabel audio (measured 2026-11-01: ADTS under 0x11, non-ADTS under 0x0F), so this
 * reports what the bytes are, not what the PMT says. A host can start its decoder from this and ignore
 * the PMT's stream_type for audio.
 */
export type AudioCodecMessage = {
    type: "audioCodec";
    componentId: number;
    pid: number;
    /** The PMT's stream_type, kept so the host can log a label-vs-payload disagreement. */
    streamType: number;
    codec: "adts" | "latm" | "mp2" | "ac3";
    /** What the PMT label claims (null when the type names no known audio). */
    expectedCodec: "adts" | "latm" | "mp2" | "ac3" | null;
    /** False when the label disagrees with the bytes - the mux lies about this component. */
    labelAgrees: boolean;
};
export type ResponseMessage = PMTMessage | EmergencyInfoMessage | ModuleDownloadedMessage | ModuleListUpdatedMessage | ProgramInfoMessage | CurrentTime | VideoStreamUrlMessage | ErrorMessage | ESEventUpdatedMessage | BITMessage | PCRMessage | PESMessage | AudioCodecMessage;
//# sourceMappingURL=messages.d.ts.map