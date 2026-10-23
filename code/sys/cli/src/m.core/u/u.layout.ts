/**
 * Package-private terminal presentation ceilings.
 *
 * A 16-bit envelope bounds physical cells plus aggregate source and output code units. Explicit
 * line and collection ceilings prevent a small value at each boundary from composing into bulk
 * synchronous formatter work.
 */
export const MAX_TERMINAL_CELLS = 65_535;
export const MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS = 65_535;
export const MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS = 65_535;
export const MAX_TERMINAL_TEXT_LINES = 4_096;
export const MAX_WIDTH_COLLECTION_LENGTH = 4_096;
