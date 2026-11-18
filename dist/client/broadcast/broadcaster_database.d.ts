import { ResponseMessage } from "../../protocol/messages";
import * as resource from "../resource";
import { type Logger } from "../util/logger";
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
    /**
     * Parses one stored row. A corrupt value is dropped and named in the log instead of aborting
     * startup: the database is rebuilt from the next broadcast, but a throw here kills the browser.
     */
    private parseStored;
    private loadDatabase;
    openDatabase(): void;
    /**
     * Records one affiliation row and mirrors it to localStorage only when it actually changed and
     * is newer than what is stored, so a re-sent BIT does not rewrite the same key.
     */
    private storeAffiliation;
    onMessage(msg: ResponseMessage): void;
}
//# sourceMappingURL=broadcaster_database.d.ts.map