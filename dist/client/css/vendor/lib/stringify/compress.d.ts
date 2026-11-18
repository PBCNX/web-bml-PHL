export = Compiler;
/**
 * Initialize a new `Compiler`.
 */
declare function Compiler(options: any): void;
declare class Compiler {
    /**
     * Initialize a new `Compiler`.
     */
    constructor(options: any);
    /**
     * Compile `node`.
     */
    compile(node: any): any;
    /**
     * Visit comment node.
     */
    comment(node: any): any;
    /**
     * Visit import node.
     */
    import(node: any): any;
    /**
     * Visit media node.
     */
    media(node: any): any;
    /**
     * Visit document node.
     */
    document(node: any): any;
    /**
     * Visit charset node.
     */
    charset(node: any): any;
    /**
     * Visit namespace node.
     */
    namespace(node: any): any;
    /**
     * Visit supports node.
     */
    supports(node: any): any;
    /**
     * Visit keyframes node.
     */
    keyframes(node: any): any;
    /**
     * Visit keyframe node.
     */
    keyframe(node: any): any;
    /**
     * Visit page node.
     */
    page(node: any): any;
    /**
     * Visit font-face node.
     */
    'font-face'(node: any): any;
    /**
     * Visit host node.
     */
    host(node: any): any;
    /**
     * Visit custom-media node.
     */
    'custom-media'(node: any): any;
    /**
     * Visit rule node.
     */
    rule(node: any): any;
    /**
     * Visit declaration node.
     */
    declaration(node: any): any;
}
//# sourceMappingURL=compress.d.ts.map