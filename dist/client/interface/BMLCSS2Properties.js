"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BMLCSS2Properties = exports.BMLCSSStyleDeclaration = void 0;
const transpile_css_1 = require("../transpile_css");
class BMLCSSStyleDeclaration {
    baseDeclarationMap;
    declarationMap;
    computedPropertyGetter;
    propertySetter;
    constructor(baseDeclarationMap, declarationMap, computedPropertyGetter, propertySetter) {
        this.baseDeclarationMap = baseDeclarationMap;
        this.declarationMap = declarationMap;
        this.computedPropertyGetter = computedPropertyGetter;
        this.propertySetter = propertySetter;
    }
    setProperty(property, value) {
        // 一旦削除して列挙が設定順にされるようにしておく
        this.declarationMap.delete(property);
        this.declarationMap.set(property, value);
        this.propertySetter(property, value);
    }
    getPropertyValue(property) {
        const value = this.declarationMap.get(property) ?? this.baseDeclarationMap.get(property);
        return value == null || value.toLowerCase().trim() === "inherit" ? this.computedPropertyGetter(property) : value;
    }
}
exports.BMLCSSStyleDeclaration = BMLCSSStyleDeclaration;
class BMLCSS2Properties {
    declaration;
    node;
    eventTarget;
    constructor(declaration, node, eventTarget) {
        this.declaration = declaration;
        this.node = node;
        this.eventTarget = eventTarget;
    }
    getColorIndexVariable(bmlPropName, cssPropName) {
        const v = this.declaration.getPropertyValue("--" + bmlPropName).trim();
        if (v !== "") {
            return v;
        }
        return (0, transpile_css_1.varToColorIndex)(this.declaration.getPropertyValue(cssPropName)) ?? "";
    }
    setColorIndexVariable(bmlPropName, cssPropName, value) {
        this.declaration.setProperty("--" + bmlPropName, value);
        if (cssPropName === "background-color") {
            this.declaration.setProperty("--background-color", (0, transpile_css_1.colorIndexToVar)(value) ?? "");
            // videoPlaneModeEnabledの場合bodyにはbackground-colorを設定しない
            if (this.declaration.getPropertyValue("background-color") === "transparent") {
                return;
            }
        }
        this.declaration.setProperty(cssPropName, (0, transpile_css_1.colorIndexToVar)(value) ?? "");
    }
    get paddingTop() { return this.declaration.getPropertyValue("padding-top"); }
    get paddingRight() { return this.declaration.getPropertyValue("padding-right"); }
    get paddingBottom() { return this.declaration.getPropertyValue("padding-bottom"); }
    get paddingLeft() { return this.declaration.getPropertyValue("padding-left"); }
    get borderWidth() { return this.declaration.getPropertyValue("border-width"); }
    get borderStyle() { return this.declaration.getPropertyValue("border-style"); }
    get left() { return this.declaration.getPropertyValue("left"); }
    set left(value) { this.declaration.setProperty("left", String(value)); }
    get top() { return this.declaration.getPropertyValue("top"); }
    set top(value) { this.declaration.setProperty("top", String(value)); }
    get width() { return this.declaration.getPropertyValue("width"); }
    set width(value) { this.declaration.setProperty("width", String(value)); }
    get height() { return this.declaration.getPropertyValue("height"); }
    set height(value) { this.declaration.setProperty("height", String(value)); }
    get lineHeight() { return this.declaration.getPropertyValue("--line-height-raw").trim(); }
    get visibility() { return this.declaration.getPropertyValue("visibility"); }
    set visibility(value) { this.declaration.setProperty("visibility", String(value)); }
    get fontFamily() { return this.declaration.getPropertyValue("font-family"); }
    set fontFamily(value) { this.declaration.setProperty("font-family", String(value)); }
    get fontSize() {
        const fontSize = this.declaration.getPropertyValue("--font-size-raw");
        return fontSize.trim();
    }
    set fontSize(value) {
        this.declaration.setProperty("--font-size-raw", String(value));
        this.declaration.setProperty("--font-size", (0, transpile_css_1.setFontSize)(String(value)));
    }
    get fontWeight() { return this.declaration.getPropertyValue("font-weight"); }
    set fontWeight(value) { this.declaration.setProperty("font-weight", String(value)); }
    get textAlign() { return this.declaration.getPropertyValue("text-align"); }
    get letterSpacing() { return this.declaration.getPropertyValue("letter-spacing"); }
    get borderTopColorIndex() {
        return this.getColorIndexVariable("border-top-color-index", "border-top-color");
    }
    set borderTopColorIndex(value) {
        this.setColorIndexVariable("border-top-color-index", "border-top-color", String(value));
    }
    get borderRightColorIndex() {
        return this.getColorIndexVariable("border-right-color-index", "border-right-color");
    }
    set borderRightColorIndex(value) {
        this.setColorIndexVariable("border-right-color-index", "border-right-color", String(value));
    }
    get borderLeftColorIndex() {
        return this.getColorIndexVariable("border-left-color-index", "border-left-color");
    }
    set borderLeftColorIndex(value) {
        this.setColorIndexVariable("border-left-color-index", "border-left-color", String(value));
    }
    get borderBottomColorIndex() {
        return this.getColorIndexVariable("border-bottom-color-index", "border-bottom-color");
    }
    set borderBottomColorIndex(value) {
        this.setColorIndexVariable("border-bottom-color-index", "border-bottom-color", String(value));
    }
    get backgroundColorIndex() {
        return this.getColorIndexVariable("background-color-index", "background-color");
    }
    set backgroundColorIndex(value) {
        this.setColorIndexVariable("background-color-index", "background-color", String(value));
    }
    get colorIndex() {
        return this.getColorIndexVariable("color-index", "color");
    }
    set colorIndex(value) {
        this.setColorIndexVariable("color-index", "color", String(value));
    }
    get grayscaleColorIndex() {
        return this.declaration.getPropertyValue("--grayscale-color-index").trim();
    }
    set grayscaleColorIndex(value) {
        this.declaration.setProperty("--grayscale-color-index", String(value));
    }
    get clut() {
        return this.declaration.getPropertyValue("--clut").trim();
    }
    get resolution() {
        return this.declaration.getPropertyValue("--resolution").trim();
    }
    get displayAspectRatio() {
        return this.declaration.getPropertyValue("--display-aspect-ratio").trim();
    }
    get navIndex() {
        return this.declaration.getPropertyValue("--nav-index").trim();
    }
    get navUp() {
        return this.declaration.getPropertyValue("--nav-up").trim();
    }
    get navDown() {
        return this.declaration.getPropertyValue("--nav-down").trim();
    }
    get navLeft() {
        return this.declaration.getPropertyValue("--nav-left").trim();
    }
    get navRight() {
        return this.declaration.getPropertyValue("--nav-right").trim();
    }
    get usedKeyList() {
        return this.declaration.getPropertyValue("--used-key-list").trim();
    }
    set usedKeyList(value) {
        value = String(value);
        this.declaration.setProperty("--used-key-list", value);
        if (this.node instanceof HTMLBodyElement) {
            // bodyにfocus/activeは運用されない
            this.eventTarget.dispatchEvent(new CustomEvent("usedkeylistchanged", {
                detail: {
                    usedKeyList: new Set(value.split(" ").filter((x) => {
                        return x === "basic" || x === "numeric-tuning" || x === "data-button" || x === "special-1" || x === "special-2";
                    }))
                }
            }));
        }
    }
    // Cプロファイル
    get borderTopColor() { return this.declaration.getPropertyValue("border-top-color"); }
    set borderTopColor(value) { this.declaration.setProperty("border-top-color", String(value)); }
    get borderRightColor() { return this.declaration.getPropertyValue("border-right-color"); }
    set borderRightColor(value) { this.declaration.setProperty("border-right-color", String(value)); }
    get borderBottomColor() { return this.declaration.getPropertyValue("border-bottom-color"); }
    set borderBottomColor(value) { this.declaration.setProperty("border-bottom-color", String(value)); }
    get borderLeftColor() { return this.declaration.getPropertyValue("border-left-color"); }
    set borderLeftColor(value) { this.declaration.setProperty("border-left-color", String(value)); }
    get backgroundColor() { return this.declaration.getPropertyValue("--background-color").trim(); }
    // Cプロファイルで<a>でフォーカスが当たった時背景色を文字色を入れ替えるために変数としても追加する
    set backgroundColor(value) {
        value = String(value);
        this.declaration.setProperty("--background-color", value);
        this.declaration.setProperty("--background-color-inherit", value);
        this.declaration.setProperty("background-color", value);
    }
    get color() { return this.declaration.getPropertyValue("--color").trim(); }
    set color(value) {
        value = String(value);
        this.declaration.setProperty("--color", value);
        this.declaration.setProperty("color", value);
    }
    get WapMarqueeStyle() {
        return this.declaration.getPropertyValue("---wap-marquee-style").trim();
    }
    get WapMarqueeLoop() {
        return this.declaration.getPropertyValue("---wap-marquee-loop").trim();
    }
    get WapMarqueeSpeed() {
        return this.declaration.getPropertyValue("---wap-marquee-speed").trim();
    }
    get WapInputFormat() {
        return this.declaration.getPropertyValue("---wap-input-format").trim();
    }
}
exports.BMLCSS2Properties = BMLCSS2Properties;
//# sourceMappingURL=BMLCSS2Properties.js.map