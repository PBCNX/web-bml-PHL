/**
 * P2/EWBS: what to do with an alert the demuxer surfaced.
 *
 * Kept pure and separate from `BMLBrowser` so the decision — which is the part with rules in it — can
 * be tested without a DOM. The browser does the side effects (remember the alert, launch a document).
 */
import type { EmergencyInfoMessage } from "../protocol/messages";
import { areaRelevant } from "./area_code";

/** The document to launch for a relevant alert: a fixed reference, or one chosen per alert. */
export type EwbsDocument = string | ((alert: EmergencyInfoMessage) => string | null) | null | undefined;

export type EwbsDecision = {
    /** Whether the alert concerns this receiver's area at all. */
    relevant: boolean;
    /** The areas of this alert that concern it, which is what a banner should name. */
    matchingAreas: number[];
    /** True when the alert is ending, so a host should stand down. */
    ends: boolean;
    /** The document to open, when the host configured one, the alert is starting, and it concerns us. */
    launch: string | null;
};

/**
 * Decide what an alert means for a receiver.
 *
 * `areaCode` null/0 means the host has no area configured, which `areaRelevant()` treats as "show
 * everything" — the same reading the receiver settings use for an unconfigured box.
 */
export function decideEwbsAction(alert: EmergencyInfoMessage, areaCode: number | null, document: EwbsDocument): EwbsDecision {
    const matchingAreas = alert.areaCodes.filter((code) => areaRelevant(code, areaCode ?? 0));
    const relevant = matchingAreas.length > 0;
    const ends = !alert.startEndFlag;

    let launch: string | null = null;
    if (relevant && !ends && document != null) {
        launch = typeof document === "function" ? document(alert) : document;
    }

    return { relevant, matchingAreas, ends, launch };
}
