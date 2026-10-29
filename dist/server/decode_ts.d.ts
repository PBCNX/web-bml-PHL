import { TSReader } from "arib-mmt-tlv-ts/ts/reader.js";
import * as wsApi from "./ws_api";
export type DecodeTSOptions = {
    sendCallback: (msg: wsApi.ResponseMessage) => void;
    serviceId?: number;
    parsePES?: boolean;
};
export declare function decodeTS(options: DecodeTSOptions): TSReader;
//# sourceMappingURL=decode_ts.d.ts.map