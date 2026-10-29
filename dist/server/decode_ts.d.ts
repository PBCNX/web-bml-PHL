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
/** Where the demuxer reports problems; a host can pass its Logger, and the console is the default. */
export type DecodeTSLogger = Pick<Console, "log" | "warn" | "error">;
export type DecodeTSOptions = {
    sendCallback: (msg: wsApi.ResponseMessage) => void;
    serviceId?: number;
    parsePES?: boolean;
    logger?: DecodeTSLogger;
};
export declare function decodeTS(options: DecodeTSOptions): TSReader;
//# sourceMappingURL=decode_ts.d.ts.map