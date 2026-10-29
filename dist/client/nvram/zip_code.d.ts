export type ZipRange = {
    from: number;
    to: number;
};
export type ZipCode = {
    list: ZipRange[];
    excludeList: ZipRange[];
};
export declare function decodeZipCode(buffer: Uint8Array): ZipCode;
export declare function zipCodeInclude(zipCode: ZipCode, compared: number): boolean;
//# sourceMappingURL=zip_code.d.ts.map