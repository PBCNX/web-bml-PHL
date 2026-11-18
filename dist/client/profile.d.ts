/**
 * The numeric stream profile: the ARIB `component_type` ids that select a receiver profile.
 *
 * This lived in `resource.ts`, the 1,270-line hub, so every module that only needed the ids — the
 * charset codec (92 lines), `text.ts`, the NVRAM codec — value-imported the hub and, through it, the
 * server entity parser. It is a leaf: nothing here imports another client module.
 *
 * Not to be confused with the string `Profile` in `contracts.ts`, which is what the BML `load` event
 * reports ("C" / "A" / "BS" / "CS" / ""). The two are bridged only where the event is dispatched.
 */
export declare enum Profile {
    BS = 7,
    CS = 11,
    TrProfileA = 12,
    TrProfileC = 13
}
/**
 * The letter the BML `load` event and the diagnostics report for a numeric stream profile.
 *
 * This mapping used to live as a closure inside `loadDocument`, so the diagnostics snapshot reported
 * the raw enum (`String(profile)` → "13") while the load event reported "C" for the same receiver.
 * One function, both call sites.
 */
export declare function profileLetter(profile: Profile | null | undefined): "C" | "A" | "BS" | "CS" | "";
//# sourceMappingURL=profile.d.ts.map