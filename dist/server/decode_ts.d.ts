import { TSReader } from "arib-mmt-tlv-ts/ts/reader.js";
import * as wsApi from "../protocol/messages";
/**
 * The EWBS messages one `emergency_information_descriptor` (tag 0xFC) yields.
 *
 * Split out of the reader so the mapping is testable without TS framing. The descriptor is a PMT
 * program_info descriptor — that is where PBCNX's injector writes it and where their end-to-end stream
 * carries it; an SDT hook never fires, which is how the first version of this went unnoticed.
 */
export declare function emergencyInfoMessages(serviceId: number, descriptor: unknown): wsApi.EmergencyInfoMessage[];
/**
 * 3.0.0: the end of an alert, as the receiver can observe it — the descriptor left the PMT (the profile's stop procedure;
 * the TMCC activation flag is not carried in the TS). Distinct from startEndFlag 0, which TR-B14 calls a
 * test and the PH profile does not adopt as an ending (TR-B14 Vol. 1; the PH profile does not adopt that test method).
 */
export declare function emergencyStopMessage(serviceId: number): wsApi.EmergencyInfoMessage;
/** Where the demuxer reports problems; a host can pass its Logger, and the console is the default. */
export type DecodeTSLogger = Pick<Console, "log" | "warn" | "error">;
export type DecodeTSOptions = {
    sendCallback: (msg: wsApi.ResponseMessage) => void;
    serviceId?: number;
    parsePES?: boolean;
    logger?: DecodeTSLogger;
};
/** The BIT section shape this module needs; the library's type, narrowed to what is read. */
export type BitSection = {
    originalNetworkId: number;
    broadcasters: {
        broadcasterId: number;
        broadcasterDescriptors: readonly unknown[];
    }[];
};
/**
 * 2.6.1: BIT section → the "bit" message the client's BroadcasterDatabase consumes.
 *
 * The table carries a broadcaster's name (0xD8), its service list (0x41) and, for terrestrial
 * broadcasters, the extended broadcaster descriptor (0xCE) with the affiliation ids and the broadcasters
 * that belong to the same affiliation. A BS/CS broadcaster may carry no 0xCE at all — the BS-TBS capture
 * has only serviceList, siParameter and broadcasterName — so an empty affiliation list is a fact about
 * the stream, not a parse failure.
 */
export declare function bitMessageFromSection(section: BitSection): wsApi.BITMessage;
export declare function decodeTS(options: DecodeTSOptions): TSReader;
//# sourceMappingURL=decode_ts.d.ts.map