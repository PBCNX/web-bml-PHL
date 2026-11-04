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
    // The profile's emergency-warning rules: start_end_flag 0 means the EWBS has ended, and the stop
    // procedure also removes the descriptor, which arrives here as `stopped`. A descriptor still in the
    // PMT with 0 is therefore an ended warning - it launches nothing, and it does not clear a live alert;
    // only `stopped` clears one. (Japan's TR-B14 Vol. 4 reads 0 as a test transmission; the PH profile
    // does not adopt that method, and its own test transmission is signalled by the TMCC activation flag,
    // which is not in the transport stream.)
    let launch: string | null = null;
    if (relevant && alert.startEndFlag && document != null) {
        launch = typeof document === "function" ? document(alert) : document;
    }

    return { relevant, matchingAreas, launch };
}
