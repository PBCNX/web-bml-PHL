export type DRCSGlyph = {
    fontId: FontId;
    width: number;
    height: number;
    depth: number;
    bitmap: number[];
};
export type DRCSGlyphs = {
    ku: number;
    ten: number;
    glyphs: DRCSGlyph[];
};
export declare class BinaryWriter {
    private buffer;
    private view;
    private offset;
    private size;
    constructor();
    get position(): number;
    seek(offset: number): number;
    private extend;
    writeUInt8(value: number): number;
    writeUInt16BE(value: number): number;
    writeUInt24BE(value: number): number;
    writeUInt32BE(value: number): number;
    writeInt8(value: number): number;
    writeInt16BE(value: number): number;
    writeInt32BE(value: number): number;
    writeInt64BE(value: number): number;
    utf8Encoder?: TextEncoder;
    writeASCII(value: string): number;
    writeBuffer(value: Uint8Array): number;
    getBuffer(): Uint8Array<ArrayBuffer>;
    subarray(start?: number | undefined, end?: number | undefined): Uint8Array;
}
export declare function toTTF(glyphs: DRCSGlyphs[]): {
    ttf: Uint8Array<ArrayBuffer>;
    unicodeCharacters: number[];
};
export declare enum FontId {
    RoundGothic = 1,// 丸ゴシック
    SquareGothic = 2,// 角ゴシック
    BoldRoundGothic = 3
}
export declare function loadDRCS(drcs: Uint8Array<ArrayBuffer>, filterId?: number): DRCSGlyphs[];
//# sourceMappingURL=drcs.d.ts.map