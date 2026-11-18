export = Compiler;
/**
 * Initialize a compiler.
 *
 * @param {Type} name
 * @return {Type}
 * @api public
 */
declare function Compiler(opts: any): Type;
declare class Compiler {
    /**
     * Initialize a compiler.
     *
     * @param {Type} name
     * @return {Type}
     * @api public
     */
    constructor(opts: any);
    options: any;
    /**
     * Emit `str`
     */
    emit(str: any): any;
    /**
     * Visit `node`.
     */
    visit(node: any): any;
    /**
     * Map visit over array of `nodes`, optionally using a `delim`
     */
    mapVisit(nodes: any, delim: any): string;
}
//# sourceMappingURL=compiler.d.ts.map