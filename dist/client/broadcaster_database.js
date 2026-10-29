"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcasterDatabase = void 0;
function broadcasterEquals(lhs, rhs) {
    if (lhs.terrestrialBroadcasterId != rhs.terrestrialBroadcasterId) {
        return false;
    }
    const lhsEntries = Object.entries(lhs.services);
    const rhsEntries = Object.entries(rhs.services);
    if (lhsEntries.length !== rhsEntries.length) {
        return false;
    }
    return JSON.stringify(lhsEntries.sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))) === JSON.stringify(rhsEntries.sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b)));
}
function affiliationsEquals(lhs, rhs) {
    if (lhs == null) {
        return false;
    }
    return lhs.length === rhs.length && lhs.every(x => rhs.indexOf(x) !== -1);
}
const broadcaster_4_1 = require("./broadcaster_4");
const broadcaster_6_1 = require("./broadcaster_6");
const broadcaster_7_1 = require("./broadcaster_7");
class BroadcasterDatabase {
    resources; // iru?
    prefix;
    logger;
    constructor(resources, logger, prefix) {
        this.resources = resources;
        this.logger = logger;
        this.prefix = prefix ?? "";
        this.broadcastersPrefix = this.prefix + "broadcasters_";
        this.affiliationsPrefix = this.prefix + "affiliations_";
    }
    broadcastersPrefix = "broadcasters_";
    affiliationsPrefix = "affiliations_";
    // 録画再生時に上書きしたら困るので分ける
    broadcasters = new Map();
    affiliations = new Map();
    localStorageBroadcasters = new Map();
    localStorageAffiliations = new Map();
    getBroadcasterId(originalNetworkId, serviceId) {
        if (originalNetworkId == null || serviceId == null) {
            return null;
        }
        const broadcaster = this.broadcasters.get(originalNetworkId);
        if (broadcaster == null) {
            return null;
        }
        const service = broadcaster.services[serviceId];
        return service?.broadcasterId;
    }
    getAffiliationIdList(originalNetworkId, broadcasterId) {
        if (originalNetworkId == null) {
            return null;
        }
        const bid = broadcasterId ?? 255;
        return this.affiliations.get(`${originalNetworkId}.${bid}`)?.affiliations ?? null;
    }
    seedDatabase() {
        if (!localStorage.getItem(this.broadcastersPrefix + "4")) {
            localStorage.setItem(this.broadcastersPrefix + "4", JSON.stringify(broadcaster_4_1.broadcaster4));
        }
        if (!localStorage.getItem(this.broadcastersPrefix + "6")) {
            localStorage.setItem(this.broadcastersPrefix + "6", JSON.stringify(broadcaster_6_1.broadcaster6));
        }
        if (!localStorage.getItem(this.broadcastersPrefix + "7")) {
            localStorage.setItem(this.broadcastersPrefix + "7", JSON.stringify(broadcaster_7_1.broadcaster7));
        }
        // BS向けにaffiliationsを提示しているのは全国に地上局を持っているNHKだけ?
        if (!localStorage.getItem(this.affiliationsPrefix + "4.1")) {
            localStorage.setItem(this.affiliationsPrefix + "4.1", "{\"affiliations\":[0,1],\"lastUpdated\":1647613392353}");
        }
    }
    loadDatabase() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.broadcastersPrefix)) {
                const n = Number.parseInt(key.substring(this.broadcastersPrefix.length));
                if (!Number.isInteger(n)) {
                    continue;
                }
                const v = localStorage.getItem(key);
                if (v == null) {
                    continue;
                }
                const broadcaster = JSON.parse(v);
                this.localStorageBroadcasters.set(n, { services: Object.fromEntries(Object.entries(broadcaster.services).map(([k, v]) => [Number(k), v])), lastUpdated: broadcaster.lastUpdated });
            }
            if (key?.startsWith(this.affiliationsPrefix)) {
                const k = key.substring(this.affiliationsPrefix.length);
                const v = localStorage.getItem(key);
                if (v == null) {
                    continue;
                }
                const affiliation = JSON.parse(v);
                this.localStorageAffiliations.set(k, affiliation);
            }
        }
        this.broadcasters = new Map(this.localStorageBroadcasters.entries());
        this.affiliations = new Map(this.localStorageAffiliations.entries());
    }
    openDatabase() {
        this.seedDatabase();
        this.loadDatabase();
        // broadcasters_<originalNetworkId>
        // affiliations_<originalNetworkId>.<broadcasterId>
    }
    onMessage(msg) {
        if (msg.type === "bit") {
            const lastUpdated = this.resources.currentTimeUnixMillis;
            for (const broadcaster of msg.broadcasters) {
                if (broadcaster.broadcasterId === 255) {
                    const key = `${msg.originalNetworkId}.${broadcaster.broadcasterId}`;
                    const v = { affiliations: broadcaster.affiliations, lastUpdated: lastUpdated ?? new Date().getTime() };
                    this.affiliations.set(key, v);
                    if (lastUpdated != null) {
                        const prev = this.localStorageAffiliations.get(key);
                        if (prev == null || !affiliationsEquals(prev.affiliations, v.affiliations)) {
                            this.localStorageAffiliations.set(key, v);
                            if (prev == null || prev.lastUpdated < lastUpdated) {
                                localStorage.setItem(this.affiliationsPrefix + key, JSON.stringify(v));
                            }
                        }
                    }
                    for (const b of broadcaster.affiliationBroadcasters) {
                        const key = `${b.originalNetworkId}.${b.broadcasterId}`;
                        const v = { affiliations: broadcaster.affiliations, lastUpdated: lastUpdated ?? new Date().getTime() };
                        this.affiliations.set(key, v);
                        if (lastUpdated != null) {
                            const prev = this.localStorageAffiliations.get(key);
                            if (prev == null || !affiliationsEquals(prev.affiliations, v.affiliations)) {
                                this.localStorageAffiliations.set(key, v);
                                if (prev == null || prev.lastUpdated < lastUpdated) {
                                    localStorage.setItem(this.affiliationsPrefix + key, JSON.stringify(v));
                                }
                            }
                        }
                    }
                    continue;
                }
            }
            const key = `${this.broadcastersPrefix}${msg.originalNetworkId}`;
            const tbid = msg.broadcasters.filter(x => x.terrestrialBroadcasterId != null);
            if (tbid.length > 1) {
                this.logger.error(`${this.logger.prefix}tbid.length > 1`, tbid);
            }
            const v = {
                services: Object.fromEntries(msg.broadcasters.flatMap(x => x.services.map(y => [`${y.serviceId}`, { broadcasterId: x.broadcasterId }]))),
                terrestrialBroadcasterId: tbid[0]?.terrestrialBroadcasterId,
                lastUpdated: lastUpdated ?? new Date().getTime(),
            };
            this.broadcasters.set(msg.originalNetworkId, v);
            if (lastUpdated != null) {
                const prev = this.localStorageBroadcasters.get(msg.originalNetworkId);
                if (prev == null || !broadcasterEquals(v, prev)) {
                    this.localStorageBroadcasters.set(msg.originalNetworkId, v);
                    if (prev == null || prev.lastUpdated < lastUpdated) {
                        localStorage.setItem(key, JSON.stringify(v));
                    }
                }
            }
        }
    }
}
exports.BroadcasterDatabase = BroadcasterDatabase;
//# sourceMappingURL=broadcaster_database.js.map