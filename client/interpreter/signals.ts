/**
 * The value a host binding yields to tell the interpreter that the page is navigating away.
 *
 * It was declared in both `es2_binding.ts` and `es2_interpreter.ts`; the second copy existed only to
 * spell the generator's type union and was never compared against the yielded value, so a change to
 * one copy would have silently stopped matching the other.
 */
export const LAUNCH_DOCUMENT_CALLED = { type: "launchDocumentCalled" } as const;

export type LaunchDocumentCalled = typeof LAUNCH_DOCUMENT_CALLED;
