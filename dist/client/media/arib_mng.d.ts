export type MNGAnimation = {
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
    width: number;
    height: number;
    blobs: string[];
};
export declare function aribMNGToCSSAnimation(mngData: Uint8Array<ArrayBuffer>, clut: number[][]): MNGAnimation | null;
//# sourceMappingURL=arib_mng.d.ts.map