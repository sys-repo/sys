export type * from './t.Use.ErrorMarkers.ts';

type LinePos = { line: number; col: number };

/**
 * Generic diagnostic marker:
 * message, code, and optional line/char ranges.
 */
export type Diagnostic = {
  readonly message: string;
  readonly code?: string | number;
  readonly linePos?: [LinePos, LinePos];
  readonly pos?: [number, number?];
};
