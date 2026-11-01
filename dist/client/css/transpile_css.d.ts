import css from 'css';
export declare function parseCSSValue(value: string): string | null;
export type CSSTranspileOptions = {
    inline: boolean;
    clutReader: (cssValue: string) => Promise<css.Declaration[]>;
    convertUrl?: (url: string) => Promise<{
        blobUrl: string;
        width?: number;
        height?: number;
    } | undefined>;
};
export declare function colorIndexToVar(colorIndex: string | null | undefined): string | null | undefined;
export declare function varToColorIndex(colorIndexVar: string | null | undefined): string | null | undefined;
/** Translates a BML font-size keyword to the internal value. Not a setter: it returns, never mutates. */
export declare function translateFontSizeKeyword(value: string): string;
/** Translates a BML line-height keyword to the internal value. Not a setter: it returns, never mutates. */
export declare function translateLineHeightKeyword(value: string): string;
export declare function transpileCSS(style: string, opts: CSSTranspileOptions): Promise<string>;
//# sourceMappingURL=transpile_css.d.ts.map