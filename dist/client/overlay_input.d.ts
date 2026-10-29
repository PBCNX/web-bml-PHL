import { InputApplication, InputApplicationLaunchOptions, InputCancelReason } from "./bml_browser";
export declare class OverlayInputApplication implements InputApplication {
    private readonly container;
    private readonly input;
    private readonly submitButton;
    private readonly cancelButton;
    private callback?;
    constructor(container: HTMLElement);
    private submit;
    launch({ characterType, allowedCharacters, maxLength, value, inputMode, callback }: InputApplicationLaunchOptions): void;
    cancel(_reason: InputCancelReason): void;
    get isLaunching(): boolean;
}
//# sourceMappingURL=overlay_input.d.ts.map