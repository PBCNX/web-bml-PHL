/*!
 * ECMAScript 2nd Edition Interpreter
 * <https://github.com/otya128/es2>
 *
 * SPDX-FileCopyrightText: 2025 otya
 * SPDX-License-Identifier: MIT
 */
declare const keywords: readonly ["break", "for", "new", "var", "continue", "function", "return", "void", "delete", "if", "this", "while", "else", "in", "typeof", "with"];
declare const futureReservedWords: readonly ["abstract", "do", "import", "short", "boolean", "double", "instanceof", "static", "byte", "enum", "int", "super", "case", "export", "interface", "switch", "catch", "extends", "long", "synchronized", "char", "final", "native", "throw", "class", "finally", "package", "throws", "const", "float", "private", "transient", "debugger", "goto", "protected", "try", "default", "implements", "public", "volatile"];
declare const punctuators: readonly ["~", "}", "||", "|=", "|", "{", "^=", "^", "]", "[", "?", ">>>=", ">>>", ">>=", ">>", ">=", ">", "==", "=", "<=", "<<=", "<<", "<", ";", ":", "/=", "/", ".", "-=", "--", "-", ",", "+=", "++", "+", "*=", "*", ")", "(", "&=", "&&", "&", "%=", "%", "!=", "!"];
type Punctuators = (typeof punctuators)[number];
type Keywords = (typeof keywords)[number];
type FutureReservedWords = (typeof futureReservedWords)[number];
export type SourceInfo = {
    name: string;
    source?: string;
};
export type Position = {
    index: number;
    line: number;
    column: number;
    sourceInfo: SourceInfo | undefined;
};
export type Keyword = {
    type: "keyword";
    value: Keywords;
    start: Position;
    end: Position;
};
export type FutureReservedWord = {
    type: "futureReservedWord";
    value: FutureReservedWords;
    start: Position;
    end: Position;
};
export type NullLiteral = {
    type: "nullLiteral";
    value: null;
    start: Position;
    end: Position;
};
export type BooleanLiteral = {
    type: "booleanLiteral";
    value: boolean;
    start: Position;
    end: Position;
};
export type ReservedWord = Keyword | FutureReservedWord | NullLiteral | BooleanLiteral;
export type Literal = NullLiteral | BooleanLiteral | NumericLiteral | StringLiteral;
export type Identifier = {
    type: "identifier";
    value: string;
    start: Position;
    end: Position;
};
export type Punctuator = {
    type: "punctuator";
    value: Punctuators;
    start: Position;
    end: Position;
};
export type NumericLiteral = {
    type: "numericLiteral";
    value: number;
    start: Position;
    end: Position;
};
export type StringLiteral = {
    type: "stringLiteral";
    value: string;
    start: Position;
    end: Position;
};
export type LineTerminator = {
    type: "lineTerminator";
    value: "\n";
    start: Position;
    end: Position;
};
export type EndToken = {
    type: "end";
    value: "<EOF>";
    start: Position;
    end: Position;
};
export type Token = ReservedWord | Identifier | Punctuator | NumericLiteral | StringLiteral | LineTerminator | EndToken;
export declare class InterpreterSyntaxError extends Error {
    stackTrace?: StackTraceEntry[];
    constructor(message: string, stackTrace: StackTraceEntry[], options?: ErrorOptions);
}
export declare class InterpreterReferenceError extends Error {
    stackTrace: StackTraceEntry[];
    constructor(message: string, context: Context, caller: Caller);
}
export declare class InterpreterTypeError extends Error {
    stackTrace: StackTraceEntry[];
    constructor(message: string, context: Context, caller: Caller);
}
export declare class InterpreterRangeError extends Error {
    stackTrace: StackTraceEntry[];
    constructor(message: string, context: Context, caller: Caller);
}
export declare function tokenize(source: string, sourceInfo?: SourceInfo): Generator<Token | LineTerminator, EndToken>;
export type Program = {
    type: "program";
    sourceElements: SourceElement[];
    start: Position;
    end: Position;
};
export type SourceElement = Statement | FunctionDeclaration;
export type Statement = Block | VariableStatement | EmptyStatement | ExpressionStatement | IfStatement | IterationStatement | ContinueStatement | BreakStatement | ReturnStatement | WithStatement;
export type Block = {
    type: "block";
    statementList: Statement[];
    start: Position;
    end: Position;
};
export type VariableStatement = {
    type: "variableStatement";
    variableDeclarationList: VariableDeclaration[];
    start: Position;
    end: Position;
};
export type VariableDeclaration = {
    type: "variableDeclaration";
    name: string;
    initializer: AssignmentExpression | undefined;
    start: Position;
    end: Position;
};
export type EmptyStatement = {
    type: "emptyStatement";
    start: Position;
    end: Position;
};
export type ExpressionStatement = {
    type: "expressionStatement";
    expression: Expression;
    start: Position;
    end: Position;
};
export type IfStatement = {
    type: "ifStatement";
    expression: Expression;
    thenStatement: Statement;
    elseStatement: Statement | undefined;
    start: Position;
    end: Position;
};
export type IterationStatement = WhileStatement | ForStatement | ForInStatement;
export type WhileStatement = {
    type: "whileStatement";
    expression: Expression;
    statement: Statement;
    start: Position;
    end: Position;
};
export type ForStatement = {
    type: "forStatement";
    initialization: Expression | VariableStatement | undefined;
    condition: Expression | undefined;
    afterthought: Expression | undefined;
    statement: Statement;
    start: Position;
    end: Position;
};
export type ForInStatement = {
    type: "forInStatement";
    initialization: LeftHandSideExpression | VariableDeclaration;
    expression: Expression;
    statement: Statement;
    start: Position;
    end: Position;
};
export type ContinueStatement = {
    type: "continueStatement";
    start: Position;
    end: Position;
};
export type BreakStatement = {
    type: "breakStatement";
    start: Position;
    end: Position;
};
export type ReturnStatement = {
    type: "returnStatement";
    expression: Expression | undefined;
    start: Position;
    end: Position;
};
export type WithStatement = {
    type: "withStatement";
    expression: Expression;
    statement: Statement;
    start: Position;
    end: Position;
};
export type FunctionDeclaration = {
    type: "functionDeclaration";
    name: string;
    parameters: string[];
    block: Block;
    start: Position;
    end: Position;
};
export type PrimaryExpression = ThisExpression | IdentifierExpression | LiteralExpression | GroupingOperator;
export type GroupingOperator = {
    type: "groupingOperator";
    expression: Expression;
    start: Position;
    end: Position;
};
export type ThisExpression = {
    type: "thisExpression";
    start: Position;
    end: Position;
};
export type IdentifierExpression = {
    type: "identifierExpression";
    name: string;
    start: Position;
    end: Position;
};
export type LiteralExpression = {
    type: "literalExpression";
    value: string | number | boolean | null;
    start: Position;
    end: Position;
};
export type MemberExpression = PrimaryExpression | MemberOperator | NewOperator;
export type MemberOperator = {
    type: "memberOperator";
    left: CallExpression | MemberExpression;
    name: string;
    start: Position;
    end: Position;
} | {
    type: "memberOperator";
    left: CallExpression | MemberExpression;
    right: Expression;
    start: Position;
    end: Position;
};
export type NewOperator = {
    type: "newOperator";
    expression: CallExpression | MemberExpression;
    argumentList: AssignmentExpression[] | undefined;
    start: Position;
    end: Position;
};
export type CallExpression = {
    type: "callOperator";
    expression: CallExpression | MemberExpression;
    argumentList: AssignmentExpression[];
    start: Position;
    end: Position;
};
export type LeftHandSideExpression = MemberExpression | CallExpression;
export type PostfixExpression = LeftHandSideExpression | PostfixIncrementOperator | PostfixDecrementOperator;
export type PostfixIncrementOperator = {
    type: "postfixIncrementOperator";
    expression: LeftHandSideExpression;
    start: Position;
    end: Position;
};
export type PostfixDecrementOperator = {
    type: "postfixDecrementOperator";
    expression: LeftHandSideExpression;
    start: Position;
    end: Position;
};
export type UnaryExpression = PostfixExpression | DeleteOperator | VoidOperator | TypeofOperator | PrefixIncrementOperator | PrefixDecrementOperator | UnaryPlusOperator | UnaryMinusOperator | BitwiseNotOperator | LogicalNotOperator;
export type DeleteOperator = {
    type: "deleteOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type VoidOperator = {
    type: "voidOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type TypeofOperator = {
    type: "typeofOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type PrefixIncrementOperator = {
    type: "prefixIncrementOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type PrefixDecrementOperator = {
    type: "prefixDecrementOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type UnaryPlusOperator = {
    type: "unaryPlusOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type UnaryMinusOperator = {
    type: "unaryMinusOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type BitwiseNotOperator = {
    type: "bitwiseNotOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type LogicalNotOperator = {
    type: "logicalNotOperator";
    expression: UnaryExpression;
    start: Position;
    end: Position;
};
export type MultiplicativeExpression = UnaryExpression | MultiplyOperator | DivideOperator | ModuloOperator;
export type MultiplyOperator = {
    type: "multiplyOperator";
    left: MultiplicativeExpression;
    right: UnaryExpression;
    start: Position;
    end: Position;
};
export type DivideOperator = {
    type: "divideOperator";
    left: MultiplicativeExpression;
    right: UnaryExpression;
    start: Position;
    end: Position;
};
export type ModuloOperator = {
    type: "moduloOperator";
    left: MultiplicativeExpression;
    right: UnaryExpression;
    start: Position;
    end: Position;
};
export type AdditiveExpression = MultiplicativeExpression | AddOperator | SubtractOperator;
export type AddOperator = {
    type: "addOperator";
    left: AdditiveExpression;
    right: MultiplicativeExpression;
    start: Position;
    end: Position;
};
export type SubtractOperator = {
    type: "subtractOperator";
    left: AdditiveExpression;
    right: MultiplicativeExpression;
    start: Position;
    end: Position;
};
export type ShiftExpression = AdditiveExpression | LeftShiftOperator | SignedRightShiftOperator | UnsignedRightShiftOperator;
export type LeftShiftOperator = {
    type: "leftShiftOperator";
    left: ShiftExpression;
    right: AdditiveExpression;
    start: Position;
    end: Position;
};
export type SignedRightShiftOperator = {
    type: "signedRightShiftOperator";
    left: ShiftExpression;
    right: AdditiveExpression;
    start: Position;
    end: Position;
};
export type UnsignedRightShiftOperator = {
    type: "unsignedRightShiftOperator";
    left: ShiftExpression;
    right: AdditiveExpression;
    start: Position;
    end: Position;
};
export type RelationalExpression = ShiftExpression | LessThanOperator | GreaterThanOperator | LessThanOrEqualOperator | GreaterThanOrEqualOperator;
export type LessThanOperator = {
    type: "lessThanOperator";
    left: RelationalExpression;
    right: ShiftExpression;
    start: Position;
    end: Position;
};
export type GreaterThanOperator = {
    type: "greaterThanOperator";
    left: RelationalExpression;
    right: ShiftExpression;
    start: Position;
    end: Position;
};
export type LessThanOrEqualOperator = {
    type: "lessThanOrEqualOperator";
    left: RelationalExpression;
    right: ShiftExpression;
    start: Position;
    end: Position;
};
export type GreaterThanOrEqualOperator = {
    type: "greaterThanOrEqualOperator";
    left: RelationalExpression;
    right: ShiftExpression;
    start: Position;
    end: Position;
};
export type EqualityExpression = RelationalExpression | EqualsOperator | DoesNotEqualsOperator;
export type EqualsOperator = {
    type: "equalsOperator";
    left: EqualityExpression;
    right: RelationalExpression;
    start: Position;
    end: Position;
};
export type DoesNotEqualsOperator = {
    type: "doesNotEqualsOperator";
    left: EqualityExpression;
    right: RelationalExpression;
    start: Position;
    end: Position;
};
export type BitwiseAndExpression = EqualityExpression | BitwiseAndOperator;
export type BitwiseAndOperator = {
    type: "bitwiseAndOperator";
    left: BitwiseAndExpression;
    right: EqualityExpression;
    start: Position;
    end: Position;
};
export type BitwiseXorExpression = BitwiseAndExpression | BitwiseXorOperator;
export type BitwiseXorOperator = {
    type: "bitwiseXorOperator";
    left: BitwiseXorExpression;
    right: BitwiseAndExpression;
    start: Position;
    end: Position;
};
export type BitwiseOrExpression = BitwiseXorExpression | BitwiseOrOperator;
export type BitwiseOrOperator = {
    type: "bitwiseOrOperator";
    left: BitwiseOrExpression;
    right: BitwiseXorExpression;
    start: Position;
    end: Position;
};
export type LogicalAndExpression = BitwiseOrExpression | LogicalAndOperator;
export type LogicalAndOperator = {
    type: "logicalAndOperator";
    left: LogicalAndExpression;
    right: BitwiseOrExpression;
    start: Position;
    end: Position;
};
export type LogicalOrExpression = LogicalAndExpression | LogicalOrOperator;
export type LogicalOrOperator = {
    type: "logicalOrOperator";
    left: LogicalOrExpression;
    right: LogicalAndExpression;
    start: Position;
    end: Position;
};
export type ConditionalExpression = LogicalOrExpression | ConditionalOperator;
export type ConditionalOperator = {
    type: "conditionalOperator";
    conditionExpression: LogicalOrExpression;
    thenExpression: AssignmentExpression;
    elseExpression: AssignmentExpression;
    start: Position;
    end: Position;
};
export type AssignmentExpression = ConditionalExpression | AssignmentOperator;
export type AssignmentOperator = {
    type: "assignmentOperator";
    left: LeftHandSideExpression;
    operator: "=" | "*=" | "/=" | "%=" | "+=" | "-=" | "<<=" | ">>=" | ">>>=" | "&=" | "^=" | "|=";
    right: AssignmentExpression;
    start: Position;
    end: Position;
};
export type Expression = AssignmentExpression | CommaOperator;
export type CommaOperator = {
    type: "commaOperator";
    left: Expression;
    right: AssignmentExpression;
    start: Position;
    end: Position;
};
type ParserState = {
    for: boolean;
    while: boolean;
    function: boolean;
};
export declare function parse(source: string, sourceInfo?: SourceInfo): Program;
export declare function parseStatementList(source: string, state: ParserState, sourceInfo?: SourceInfo): Block;
export type Value = null | undefined | number | string | boolean | InterpreterObject;
export type PrimitiveValue = undefined | null | boolean | number | string;
export type Completion = NormalCompletion | ReturnCompletion | AbruptCompletion;
type NormalCompletion = {
    type: "normalCompletion";
    hasValue: false;
} | {
    type: "normalCompletion";
    hasValue: true;
    value: Value;
};
type ReturnCompletion = {
    type: "returnCompletion";
    hasValue: true;
    value: Value;
};
type AbruptCompletion = {
    type: "abruptCompletion";
    cause: "break";
    hasValue: false;
} | {
    type: "abruptCompletion";
    cause: "break";
    hasValue: true;
    value: Value;
} | {
    type: "abruptCompletion";
    cause: "continue";
    hasValue: false;
} | {
    type: "abruptCompletion";
    cause: "continue";
    hasValue: true;
    value: Value;
};
export declare function escapeString(s: string): string;
export type Property = {
    readOnly: boolean;
    dontEnum: boolean;
    dontDelete: boolean;
    value: Value;
};
export type DefaultValueHint = "string" | "number" | "default";
export type Caller = {
    start: Position;
    end: Position;
};
export type StackTraceEntry = {
    name: string;
    start: Position;
    end: Position;
};
export declare function walkStackTrace(context: Context, caller: Caller): StackTraceEntry[];
export type NativeFunction = (ctx: Context, self: InterpreterObject | null, args: Value[], caller: Caller) => Generator<unknown, Value>;
export type InterpreterObject = {
    internalProperties: {
        prototype: InterpreterObject | null;
        class: string;
        value: Value;
        get?: (ctx: Context, self: InterpreterObject, propertyName: string, caller: Caller) => Generator<unknown, Value>;
        put?: (ctx: Context, self: InterpreterObject, propertyName: string, value: Value, caller: Caller) => Generator<unknown, unknown>;
        canPut?: (ctx: Context, self: InterpreterObject, propertyName: string, caller: Caller) => boolean;
        hasProperty?: (ctx: Context, self: InterpreterObject, propertyName: string, caller: Caller) => boolean;
        delete?: (ctx: Context, self: InterpreterObject, propertyName: string, caller: Caller) => Value;
        defaultValue?: (ctx: Context, self: InterpreterObject, hint: DefaultValueHint, caller: Caller) => Generator<unknown, Value>;
        construct?: (ctx: Context, args: Value[], caller: Caller) => Generator<unknown, Value>;
        call?: NativeFunction;
        functionTag?: string | undefined;
        hostObjectValue?: any;
    };
    properties: Map<string, Property>;
};
export declare function defaultPutProperty(ctx: Context, self: InterpreterObject, propertyName: string, value: Value, caller: Caller): void;
export declare function putProperty(ctx: Context, self: InterpreterObject, propertyName: string, value: Value, caller: Caller): Generator<unknown, unknown>;
export declare function isPrimitive(value: Value): value is PrimitiveValue;
export declare function isObject(value: Value): value is InterpreterObject;
export declare function getDateObjectValue(value: Value): number | undefined;
type CallingInfo = {
    parent: CallingInfo | undefined;
    name: string;
    caller: Caller;
    evalCode: boolean;
};
type Scope = {
    parent: Scope | undefined;
    activation: boolean;
    object: InterpreterObject;
    callingInfo: CallingInfo | undefined;
};
export type InterruptionState = Expression | Statement;
export type Interruption = {
    type: "interruption";
    state: InterruptionState;
};
export type Context = {
    scope: Scope;
    this: InterpreterObject | null;
    realm: Realm;
    shouldInterrupt?: (state: InterruptionState) => boolean;
};
type Intrinsics = {
    eval: InterpreterObject;
    parseInt: InterpreterObject;
    parseFloat: InterpreterObject;
    escape: InterpreterObject;
    unescape: InterpreterObject;
    isNaN: InterpreterObject;
    isFinite: InterpreterObject;
    Object: InterpreterObject;
    ObjectPrototype: InterpreterObject;
    Function: InterpreterObject;
    FunctionPrototype: InterpreterObject;
    Array: InterpreterObject;
    ArrayPrototype: InterpreterObject;
    String: InterpreterObject;
    StringPrototype: InterpreterObject;
    Boolean: InterpreterObject;
    BooleanPrototype: InterpreterObject;
    Number: InterpreterObject;
    NumberPrototype: InterpreterObject;
    Math: InterpreterObject;
    Date: InterpreterObject;
    DatePrototype: InterpreterObject;
    StringPrototypeCharCodeAt: (string: string, index: number) => number;
};
type Realm = {
    intrinsics: Intrinsics;
    globalObject: InterpreterObject;
    globalScope: Scope;
};
export declare function newObject(prototype: InterpreterObject): InterpreterObject;
export declare function newNativeFunction(prototype: InterpreterObject, func: NativeFunction, length: number, name?: string): InterpreterObject;
export declare function getProperty(ctx: Context, value: InterpreterObject, name: string, caller: Caller): Generator<unknown, Value>;
export declare function toPrimitive(ctx: Context, value: Value, preferredType: DefaultValueHint, caller: Caller): Generator<unknown, PrimitiveValue>;
export declare function toString(ctx: Context, value: Value, caller: Caller): Generator<unknown, string>;
export declare function toNumber(ctx: Context, value: Value, caller: Caller): Generator<unknown, number>;
export declare function toBoolean(value: Value): boolean;
export declare function newArray(ctx: Context, elements: Value[], length?: number): InterpreterObject;
export declare function newDate(ctx: Context, date: Date): InterpreterObject;
export declare function createGlobalContext(): Context;
export declare function run(program: Program, context: Context): Generator<unknown, Completion>;
export declare function runInContext(source: string, context: Context, sourceInfo?: SourceInfo): Promise<Completion>;
export declare function runAsync(source: string, sourceInfo?: SourceInfo): Promise<Completion>;
export {};
//# sourceMappingURL=index.d.ts.map