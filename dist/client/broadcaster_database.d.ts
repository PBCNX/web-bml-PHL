import { ResponseMessage } from "../server/ws_api";
import * as resource from "./resource";
import { type Logger } from "./util/logger";
export declare class BroadcasterDatabase {
    private readonly resources;
    private readonly prefix;
    private readonly logger;
    constructor(resources: resource.Resources, logger: Logger, prefix?: string);
    private broadcastersPrefix;
    private affiliationsPrefix;
    private broadcasters;
    private affiliations;
    private localStorageBroadcasters;
    private localStorageAffiliations;
    getBroadcasterId(originalNetworkId?: number | null, serviceId?: number | null): number | null;
    getAffiliationIdList(originalNetworkId?: number | null, broadcasterId?: number | null): number[] | null;
    private seedDatabase;
    private loadDatabase;
    openDatabase(): void;
    onMessage(msg: ResponseMessage): void;
}
//# sourceMappingURL=broadcaster_database.d.ts.map