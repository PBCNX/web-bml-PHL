import { TextDecodeFunction, TextEncodeFunction } from "./text";
export declare enum BinaryTableUnit {
    Byte = "B",
    Bit = "b",
    Variable = "V"
}
export declare enum BinaryTableType {
    Boolean = "B",
    UnsignedInteger = "U",
    Integer = "I",
    String = "S",
    ZipCode = "Z",
    Pad = "P"
}
export type BinaryTableField = {
    unit: BinaryTableUnit;
    length: number;
    type: BinaryTableType;
};
export declare function parseBinaryStructure(structure: string): BinaryTableField[] | null;
export declare function readBinaryFields(buffer: Uint8Array, fields: BinaryTableField[], decodeText: TextDecodeFunction, posBits?: number): [result: any[], posBits: number];
export declare function writeBinaryFields(data: any[], fields: BinaryTableField[], encodeText: TextEncodeFunction): Uint8Array;
export declare class BinaryTable {
    rows: any[][];
    fields: BinaryTableField[];
    constructor(table: Uint8Array, structure: string, decodeText: TextDecodeFunction);
    static constructBinaryTable(buffer: Uint8Array, structure: string, decodeText: TextDecodeFunction): {
        rows: any[][];
        fields: BinaryTableField[];
    };
    get nrow(): number;
    get ncolumn(): number;
    close(): number;
    toNumber(row: number, column: number): number;
    toString(row: number, column: number): string | null;
    toArray(startRow: number, numRow: number): (any[] | null)[] | null;
    search(startRow: number, ...args: any[]): number;
}
//# sourceMappingURL=binary_table.d.ts.map