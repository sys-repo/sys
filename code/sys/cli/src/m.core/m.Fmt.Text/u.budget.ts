// Establish captured presentation authority before initializing fixed failure state.
import { TextIntrinsic } from './u.authority.ts';
import {
  MAX_TERMINAL_CELLS,
  MAX_TERMINAL_TEXT_LINES,
  MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS,
  MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS,
  MAX_WIDTH_COLLECTION_LENGTH,
} from '../u/u.layout.ts';

const LIMIT_EXCEEDED = TextIntrinsic.freeze(
  new Error('Cli.Fmt.Text finite presentation limit exceeded.'),
);

/** Add one primitive string to the aggregate synchronous source-work budget. */
export function addSourceCodeUnits(current: number, input: string): number {
  const remaining = MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - current;
  if (input.length > remaining) throw LIMIT_EXCEEDED;
  return current + input.length;
}

/** Whether a textual projection remains inside the finite output envelope. */
export function canOutputCodeUnits(length: number): boolean {
  return length <= MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS;
}

/** Refuse an aggregate textual projection before allocating beyond its finite envelope. */
export function assertOutputCodeUnits(length: number): void {
  if (!canOutputCodeUnits(length)) throw LIMIT_EXCEEDED;
}

/** Refuse source or produced line collections outside the synchronous presentation envelope. */
export function assertLineCount(length: number): void {
  if (length > MAX_TERMINAL_TEXT_LINES) throw LIMIT_EXCEEDED;
}

/** Refuse a finite Width.max collection before its entry scan exceeds the shared work envelope. */
export function assertWidthCollectionLength(length: number): void {
  if (length > MAX_WIDTH_COLLECTION_LENGTH) throw LIMIT_EXCEEDED;
}

/** Publish only exact terminal-cell measurements representable by the physical layout envelope. */
export function publishTerminalCells(width: number): number {
  if (width > MAX_TERMINAL_CELLS) throw LIMIT_EXCEEDED;
  return width;
}
