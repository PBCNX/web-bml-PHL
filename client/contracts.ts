/**
 * Leaf contracts.
 *
 * These declarations used to live in `bml_browser.ts`, the orchestrator, which made every lower
 * layer import upward: `resource.ts` needed `Indicator`/`IP`, `dom/bml_dom.ts` needed
 * `BMLBrowserEventTarget`/`InputApplication`, and `dom/bml_css2_properties.ts` needed `KeyGroup`.
 * That produced a 17-module source cycle and a 6-module runtime require cycle around the facade.
 *
 * Nothing here may import from another `client/` module — this file is the bottom of the graph, so
 * the orchestrator and the layers below it can both depend on it. `bml_browser.ts` re-exports
 * everything, so the public API is unchanged.
 */

export interface AudioNodeProvider {
    getAudioDestinationNode(): AudioNode;
}

export interface Indicator {
    // arib-dc://<..>/以降
    setUrl(name: string, loading: boolean): void;
    // テレビの下の方に出てくるデータ受信中...の表示
    setReceivingStatus(receiving: boolean): void;
    setNetworkingGetStatus(get: boolean): void;
    setNetworkingPostStatus(post: boolean): void;
    // 番組名
    setEventName(eventName: string | null): void;
}

/**
 * The host's EPG hooks. Declared for hosts that already implement them; the engine does not call
 * either method yet, so `epgTune`/`epgTuneToComponent` answer NaN rather than pretending to tune.
 */
export interface EPG {
    // 指定されたサービスを選局する
    // true: 成功, false: 失敗, never: ページ遷移などで帰らない
    tune?(originalNetworkId: number, transportStreamId: number, serviceId: number): boolean | never;
    // 指定されたサービスを選局して指定されたコンポーネントを表示する
    tuneToComponent?(originalNetworkId: number, transportStreamId: number, serviceId: number, component: string): boolean | never;
}

/**
 * One response shape for the host's HTTP seam. A rejected promise means a transport failure;
 * a non-2xx `status` is a normal result the engine interprets.
 */
export interface IPResponse {
    status: number;
    headers: Headers;
    body: Uint8Array<ArrayBuffer>;
}

export interface IP {
    isIPConnected?(): number;
    getConnectionType?(): number;
    transmitTextDataOverIP?(uri: string, body: Uint8Array<ArrayBuffer>): Promise<IPResponse>;
    get?(uri: string): Promise<IPResponse>;
    confirmIPNetwork?(destination: string, isICMP: boolean, timeoutMillis: number): Promise<{ success: boolean, ipAddress: string | null, responseTimeMillis: number | null } | null>;
}

export type InputCharacterType = "all" | "number" | "alphabet" | "hankaku" | "zenkaku" | "katakana" | "hiragana";

const hankakuNumber = "0123456789";
const hankakuAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const hankakuSymbol = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const zenkakuHiragana = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわをん";
const zenkakuKatakana = "ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヲン";
const zenkakuNumber = "０１２３４５６７８９";
const zenkakuAlphabet = "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ";
const zenkakuSymbol = "　、。・ー―「」";

export const inputCharacters: Map<InputCharacterType, string> = new Map([
    ["number", hankakuNumber],
    ["alphabet", hankakuAlphabet + hankakuSymbol],
    ["hankaku", hankakuAlphabet + hankakuNumber + hankakuSymbol],
    ["zenkaku", zenkakuHiragana + zenkakuKatakana + zenkakuAlphabet + zenkakuNumber + zenkakuSymbol],
    ["katakana", zenkakuKatakana + zenkakuSymbol],
    ["hiragana", zenkakuHiragana + zenkakuSymbol],
]);

export type InputCancelReason = "other" | "unload" | "readonly" | "blur" | "invisible";

export type InputApplicationLaunchOptions = {
    // 入力できる文字種
    characterType: InputCharacterType,
    // 入力できる文字 undefinedならば制限はない(ただしデータ放送で扱える範囲の文字のみで半角ｶﾀｶﾅなど扱えない文字もある)
    allowedCharacters?: string,
    // 最大文字数
    maxLength: number,
    // 以前入力されていた文字
    value: string,
    inputMode: "text" | "password",
    // 複数行
    multiline: boolean,
    // 文字入力が完了した際に呼ぶコールバック
    callback: (value: string) => void,
};

/**
 * TR-B14 第二分冊 1.6 文字入力機能
 */
export interface InputApplication {
    /**
     * 文字入力アプリケーションを起動
     */
    launch(options: InputApplicationLaunchOptions): void;
    /**
     * 文字入力アプリケーションを終了
     * 起動中に文書の遷移、フォーカス移動、readonly属性の設定、invisible属性が有効になった場合など
     */
    cancel(reason: InputCancelReason): void;
}

export interface Reg {
    getReg(index: number): string | undefined;
    setReg(index: number, value: string): void;
}

export type KeyGroup = "basic" | "data-button" | "numeric-tuning" | "other-tuning"
    | "special-1" | "special-2" // Cプロファイル
    ;

export type Profile = "C" | "A" | "BS" | "CS" | "";

export interface BMLBrowserEventMap {
    // 読み込まれたとき
    "load": CustomEvent<{ resolution: { width: number, height: number }, displayAspectRatio: { numerator: number, denominator: number }, profile: Profile }>;
    // invisibleが設定されているときtrue
    "invisible": CustomEvent<boolean>;
    /**
     * 動画の位置や大きさが変わった際に呼ばれるイベント
     * invisibleがtrueである場合渡される矩形に関わらず全面に表示する必要がある
     */
    "videochanged": CustomEvent<{ clientRect: { left: number, top: number, right: number, bottom: number }, boundingRect: DOMRect }>;
    "usedkeylistchanged": CustomEvent<{ usedKeyList: Set<KeyGroup> }>;
    "audiostreamchanged": CustomEvent<{ componentId: number, channelId?: number }>;
}

export interface CustomEventTarget<M> {
    addEventListener<K extends keyof M>(type: K, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void;
    dispatchEvent<K extends keyof M>(event: M[K]): boolean;
    removeEventListener<K extends keyof M>(type: K, callback: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean): void;
}

export type BMLBrowserEventTarget = CustomEventTarget<BMLBrowserEventMap>;
