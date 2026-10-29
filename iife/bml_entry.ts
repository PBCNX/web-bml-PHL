/**
 * The IIFE entry: what a browser host gets on `window.WebBML`.
 *
 * The Android app (OpenDTV) and the TVTest plugin both bundle the engine into a single script tag;
 * before this existed each host kept its own entry file (`window.WebBML = BML`) outside the repo, so
 * the bundle could not be reproduced from the engine. `tools/build-iife.mjs` builds this entry.
 */
import * as BML from "../client/bml_browser";

(globalThis as unknown as { WebBML: typeof BML }).WebBML = BML;
