/**
 * The MIME vocabulary the wire schema and the entity parser share.
 *
 * This lived in `client/entity_parser.ts`, so `protocol/messages.ts` — the bottom of the graph — had
 * to import from `client/` to name a `PMTMessage`'s media type. The vocabulary moved here so the
 * dependency runs one way: client → protocol.
 */
export type MediaType = {
    type: string;
    originalType: string;
    subtype: string;
    originalSubtype: string;
    parameters: MediaTypeParameter[];
};
export type MediaTypeParameter = {
    attribute: string;
    originalAttribute: string;
    value: string;
};
//# sourceMappingURL=media_type.d.ts.map