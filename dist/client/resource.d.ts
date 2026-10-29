import type { ComponentPMT, MediaType, ModuleListEntry, ProgramInfoMessage, ResponseMessage } from "../protocol/messages";
import { type TextCoding } from "./media/arib_text";
import { CustomEventTarget, Indicator, IP } from "./contracts";
import { Diagnostics } from "./introspection";
import { type Logger } from "./util/logger";
import { type LocalTimeOffsetSource } from "./time_offset";
import type { AudioOutput } from "./media/audio_output";
export type CachedComponent = {
    componentId: number;
    modules: Map<number, CachedModule>;
    dataEventId: number;
};
export type CachedModule = {
    moduleId: number;
    files: ReadonlyMap<string | null, CachedFile>;
    version: number;
    dataEventId: number;
};
export type CachedFileMetadata = {
    blobUrl: string;
    width?: number;
    height?: number;
};
export type CachedFile = {
    contentLocation: string | null;
    contentType: MediaType;
    data: Uint8Array<ArrayBuffer>;
    blobUrl: Map<any, CachedFileMetadata>;
};
export type RemoteCachedFile = CachedFile & {
    cacheControl?: string;
};
export type LockedComponent = {
    componentId: number;
    modules: Map<number, LockedModule>;
};
export type LockedModule = {
    moduleId: number;
    files: ReadonlyMap<string | null, CachedFile>;
    lockedBy: "lockModuleOnMemory" | "lockModuleOnMemoryEx";
    version: number;
    dataEventId: number;
};
export type DownloadComponentInfo = {
    componentId: number;
    modules: ReadonlyMap<number, ModuleListEntry>;
    dataEventId: number;
    returnToEntryFlag?: boolean;
};
export type PendingResource = {
    module: string;
    componentId: number;
    moduleId: number;
    filename: string | null;
    requestType: "lockModuleOnMemory" | "lockModuleOnMemoryEx" | null;
    ageMs: number;
    reason: "component-not-in-pmt" | "module-not-in-dii" | "waiting-for-carousel" | "pmt-not-received";
};
export type ResourcesDescription = {
    profile: number | null;
    activeDocument: string | null;
    startupComponentId: number;
    pmtRetrieved: boolean;
    pmt: {
        componentId: number;
        pid: number;
        streamType: number;
        dataComponentId: number | null;
    }[];
    dii: {
        componentId: number;
        dataEventId: number;
        returnToEntryFlag: boolean | null;
        modules: {
            moduleId: number;
            version: number;
            size: number;
        }[];
    }[];
    cached: {
        componentId: number;
        moduleId: number;
        version: number;
        dataEventId: number;
        files: number;
        bytes: number;
    }[];
    locked: {
        componentId: number;
        moduleId: number;
        lockedBy: string;
        version: number;
        files: number;
    }[];
    pending: PendingResource[];
    programInfo: {
        serviceId: number | null;
        eventId: number | null;
        eventName: string | null;
        originalNetworkId: number | null;
        transportStreamId: number | null;
    } | null;
};
interface ResourcesEventMap {
    "dataeventchanged": CustomEvent<{
        prevComponent: DownloadComponentInfo;
        component: DownloadComponentInfo;
        returnToEntryFlag?: boolean;
    }>;
    "moduleupdated": CustomEvent<{
        componentId: number;
        moduleId: number;
        version: number;
        dataEventId: number;
    }>;
    "componentupdated": CustomEvent<{
        component: DownloadComponentInfo;
    }>;
    "pmtupdated": CustomEvent<{
        prevComponents: Map<number, ComponentPMT>;
        components: Map<number, ComponentPMT>;
    }>;
}
export type ResourcesEventTarget = CustomEventTarget<ResourcesEventMap>;
import { Profile } from "./profile";
export declare class Resources {
    private readonly indicator?;
    private readonly eventTarget;
    private readonly ip;
    readonly diagnostics: Diagnostics;
    textCoding: TextCoding;
    private readonly cachedRemoteResources;
    private readonly remoteResourceRequests;
    private readonly logger;
    constructor(indicator: Indicator | undefined, ip: IP, logger: Logger);
    private _profile?;
    get profile(): Profile | undefined;
    private _activeDocument;
    private _currentComponentId;
    private _currentModuleId;
    set activeDocument(doc: string | null);
    get activeDocument(): string | null;
    get currentComponentId(): number | null;
    get currentModuleId(): number | null;
    get currentDataEventId(): number | null;
    private cachedComponents;
    private downloadComponents;
    getCachedFileBlobUrl(file: CachedFile, key?: any): string;
    private lockedComponents;
    private pmtComponents;
    private pmtRetrieved;
    getCachedModule(componentId: number, moduleId: number): CachedModule | undefined;
    getPMTComponent(componentId: number): ComponentPMT | undefined;
    lockCachedModule(componentId: number, moduleId: number, lockedBy: "lockModuleOnMemory" | "lockModuleOnMemoryEx"): boolean;
    isModuleLocked(componentId: number, moduleId: number): boolean;
    getModuleLockedBy(componentId: number, moduleId: number): "lockModuleOnMemory" | "lockModuleOnMemoryEx" | undefined;
    unlockModules(lockedBy?: "lockModuleOnMemory" | "lockModuleOnMemoryEx"): void;
    private revokeCachedFile;
    private revokeCachedModule;
    private revokeCachedComponent;
    unlockModule(componentId: number, moduleId: number, lockedBy: "lockModuleOnMemory" | "lockModuleOnMemoryEx"): boolean;
    componentExistsInDownloadInfo(componentId: number): boolean;
    getDownloadComponentInfo(componentId: number): DownloadComponentInfo | undefined;
    moduleExistsInDownloadInfo(componentId: number, moduleId: number): boolean;
    private currentProgramInfo;
    get dataCarouselURI(): string;
    get serviceURI(): string;
    get eventURI(): string;
    get eventName(): string | null;
    get eventId(): number | null;
    get contentId(): number | null;
    get startTimeUnixMillis(): number | null;
    get durationSeconds(): number | null;
    get serviceId(): number | null;
    get originalNetworkId(): number | null;
    get networkId(): number | null;
    get transportStreamId(): number | null;
    private currentTimeNearestPCRBase?;
    private _currentTimeUnixMillis?;
    private _localTimeOffsetMinutes?;
    /**
     * C16: a host override for the broadcast local-time offset in minutes from UTC (PH is 480).
     * `null` follows the stream's TOT descriptor, and both fall back to JST.
     */
    timeZoneOffsetMinutes: number | null;
    /** The audio-output seam: a host that plays ROM sounds/AIFF itself sets this. */
    audioOutput: AudioOutput | null;
    private maxTOTIntervalMillis;
    /**
     * C16: the stream's local-time offset from UTC in minutes — the host override, else the TOT's
     * local_time_offset descriptor, else JST. The precedence lives in time_offset.ts so the
     * configuration snapshot cannot state a different rule.
     */
    get localTimeOffsetMinutes(): number;
    /** Where the offset in use came from: the host, the stream, or the JST default. */
    get localTimeOffsetSource(): LocalTimeOffsetSource;
    /** The stream's own offset from the last TOT, null until one arrives. */
    get streamTimeOffsetMinutes(): number | null;
    get currentTimeUnixMillis(): number | null;
    nearestPCRBase?: number;
    onMessage(msg: ResponseMessage): void;
    private removeDCReferencePrefix;
    parseURL(url: string | null | undefined): {
        component: string | null;
        module: string | null;
        filename: string | null;
    };
    parseURLEx(url: string | null | undefined): {
        componentId: number | null;
        moduleId: number | null;
        filename: string | null;
    };
    parseAudioReference(url: string): {
        componentId: number | null;
        channelId: number | null;
    };
    mainAudioComponentId?: number;
    mainAudioChannelId?: number;
    get defaultAudioComponentId(): number;
    fetchLockedResource(url: string): CachedFile | null;
    private componentRequests;
    private fetchRemoteResource;
    invalidateRemoteCache(url: string): void;
    fetchResourceAsync(url: string, requestType?: "lockModuleOnMemory" | "lockModuleOnMemoryEx"): Promise<CachedFile | null>;
    getLockedModules(): Generator<{
        module: string;
        isEx: boolean;
        requesting: boolean;
    }>;
    /**
     * P1: the requests that have not been answered, with the reason. This is the difference
     * between "the carousel is slow" and "this module is not in the DII, so it will never
     * arrive" — the two look identical from outside, and only one of them is worth waiting for.
     */
    getPendingResources(): PendingResource[];
    /** P1: what the stream has actually delivered, as opposed to what the page asked for. */
    describe(): ResourcesDescription;
    private programInfoCallbacks;
    /**
     * Resolves with the current program info, or with null if the document exits before any arrives.
     * The null result is the documented failure mode: callers must not hold a promise that can only
     * settle by a broadcast that will never come.
     */
    getProgramInfoAsync(): Promise<ProgramInfoMessage | null>;
    /**
     * Settles every waiting getProgramInfoAsync with null when the document goes away, so a page
     * transition cannot leak resolvers that would only ever be called by the next program.
     */
    abandonPendingProgramInfo(reason: string): void;
    parseServiceReference(serviceRef: string): {
        originalNetworkId: number | null;
        transportStreamId: number | null;
        serviceId: number | null;
    };
    private setReceivingStatus;
    addEventListener<K extends keyof ResourcesEventMap>(type: K, callback: (this: undefined, evt: ResourcesEventMap[K]) => void, options?: AddEventListenerOptions | boolean): void;
    removeEventListener<K extends keyof ResourcesEventMap>(type: K, callback: (this: undefined, evt: ResourcesEventMap[K]) => void, options?: AddEventListenerOptions | boolean): void;
    /**
     * Drops every downloaded component and cached remote file, revoking the blob URLs first.
     * Content calls this after a PID change, when the previous service's components are unreachable.
     */
    clearCache(): void;
    get startupComponentId(): number;
    get startupModuleId(): number;
    get isInternetContent(): boolean;
    baseURIDirectory: string | null;
    setBaseURIDirectory(baseURIDirectory: string): void;
    /**
     * Whether `url` is inside the base URI directory. The scope is compared as a URL — scheme and
     * host must match, and the target must sit at a path boundary — so `http://h/a` does not admit
     * `https://h/a` and does not admit `http://h/ab`.
     */
    checkBaseURIDirectory(url: string): boolean;
}
export {};
//# sourceMappingURL=resource.d.ts.map