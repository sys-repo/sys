/** Shared identity lets the child distinguish dependency refusal from unrelated failure. */
export const INITIALIZATION_ERROR = new Error('Toolchain dependency initialization sentinel.');
