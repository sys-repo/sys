// Establish captured presentation authority before initializing private RegExp and Unicode state.
import { TextIntrinsic, TextNumeric } from './u.authority.ts';
import { MAX_TERMINAL_CELLS } from '../u/u.layout.ts';
import { stripAnsi } from './u.ansi.ts';
import { addSourceCodeUnits } from './u.budget.ts';
import { eastAsianCellWidth } from './u.width.unicode.ts';

/**
 * Owned terminal-cell measurement adapted from string-width@8.2.2.
 * Upstream license: ./LICENSE.sindresorhus.txt
 *
 * The algorithm retains only the fixed default behavior used by Cli.Fmt.Text: ANSI is ignored and
 * ambiguous East Asian characters remain narrow. All mutable semantic state is module-private.
 */
const ZERO_WIDTH_CLUSTER_PATTERN =
  /^(?:\p{Default_Ignorable_Code_Point}|\p{Control}|\p{Format}|\p{Nonspacing_Mark}|\p{Enclosing_Mark}|\p{Surrogate})+$/v;
const LEADING_NON_PRINTING_PATTERN =
  /^[\p{Default_Ignorable_Code_Point}\p{Control}\p{Format}\p{Nonspacing_Mark}\p{Enclosing_Mark}\p{Surrogate}]+/v;
const SPACING_MARK_PATTERN = /\p{Spacing_Mark}/v;
const RGI_EMOJI_PATTERN = /^\p{RGI_Emoji}$/v;
const UNQUALIFIED_KEYCAP_PATTERN = /^[\d#*]\u20E3$/;
const EXTENDED_PICTOGRAPHIC_PATTERN = /\p{Extended_Pictographic}/gu;

const TERMINAL_CELL_OVERFLOW = MAX_TERMINAL_CELLS + 1;

/** Incremental terminal-cell evidence whose final grapheme remains available for later context. */
export type TerminalCellMeasurement = Readonly<{
  /** Raw contextual code units admitted across the current rendered line. */
  codeUnits: number;
  /** Width of every grapheme proven complete before `trailingCluster`. */
  finalizedWidth: number;
  /** Final stripped grapheme, retained because a later chunk may change its boundary. */
  trailingCluster: string;
  /** Exact current width or the package-private maximum-plus-one overflow sentinel. */
  width: number;
}>;

/**
 * Measure rendered terminal cells using only private Unicode state and captured operations.
 * `MAX_TERMINAL_CELLS + 1` is an internal overflow sentinel and is never published as a width.
 */
export function measureTerminalCells(input: string): number {
  if (typeof input !== 'string' || input.length === 0) return 0;
  addSourceCodeUnits(0, input);

  const text = stripAnsi(input);
  if (text.length === 0) return 0;
  if (isPrintableAscii(text)) return text.length;

  let width = 0;
  TextIntrinsic.forEachSegment(text, (segment) => {
    width = addCellWidth(width, measureCluster(segment));
    return width <= MAX_TERMINAL_CELLS;
  });
  return width;
}

/** Start one bounded contextual measurement after finalized ASCII indentation cells. */
export function startTerminalCellMeasurement(
  input: string,
  finalizedAsciiPrefix = 0,
): TerminalCellMeasurement {
  const codeUnits = addSourceCodeUnits(finalizedAsciiPrefix, input);
  const text = stripAnsi(input);
  return createTerminalCellMeasurement(text, codeUnits, finalizedAsciiPrefix);
}

/**
 * Append one ANSI-token-aligned chunk and re-segment only the unresolved trailing grapheme. Wrap
 * chunks begin with an ASCII separator, which settles a retained cross-boundary cluster no later
 * than the following append and keeps total segmentation linear in admitted source length.
 */
export function appendTerminalCellMeasurement(
  current: TerminalCellMeasurement,
  input: string,
): TerminalCellMeasurement {
  const codeUnits = addSourceCodeUnits(current.codeUnits, input);
  const text = stripAnsi(input);
  if (text.length === 0) {
    return TextIntrinsic.freeze({
      codeUnits,
      finalizedWidth: current.finalizedWidth,
      trailingCluster: current.trailingCluster,
      width: current.width,
    });
  }

  addSourceCodeUnits(current.trailingCluster.length, text);
  const context = `${current.trailingCluster}${text}`;
  return createTerminalCellMeasurement(context, codeUnits, current.finalizedWidth);
}

TextIntrinsic.freeze(measureTerminalCells);
TextIntrinsic.freeze(startTerminalCellMeasurement);
TextIntrinsic.freeze(appendTerminalCellMeasurement);

function createTerminalCellMeasurement(
  text: string,
  codeUnits: number,
  finalizedWidth: number,
): TerminalCellMeasurement {
  let finalized = addCellWidth(0, finalizedWidth);
  let trailingCluster = '';

  if (isPrintableAscii(text)) {
    const completeLength = TextNumeric.max(0, text.length - 1);
    finalized = addCellWidth(finalized, completeLength);
    trailingCluster = TextIntrinsic.stringSlice(text, completeLength, text.length);
  } else {
    TextIntrinsic.forEachSegment(text, (segment) => {
      if (trailingCluster.length > 0) {
        finalized = addCellWidth(finalized, measureCluster(trailingCluster));
      }
      trailingCluster = segment;
    });
  }

  return TextIntrinsic.freeze({
    codeUnits,
    finalizedWidth: finalized,
    trailingCluster,
    width: addCellWidth(finalized, measureCluster(trailingCluster)),
  });
}

function measureCluster(segment: string): number {
  if (segment.length === 0 || matches(ZERO_WIDTH_CLUSTER_PATTERN, segment)) return 0;
  if (matches(RGI_EMOJI_PATTERN, segment) || isDoubleWidthNonRgiEmoji(segment)) return 2;

  const visible = TextIntrinsic.regexpReplace(LEADING_NON_PRINTING_PATTERN, segment, '');
  const hangulWidth = measureHangulCluster(visible);
  if (hangulWidth !== undefined) return hangulWidth;

  const codePoint = TextIntrinsic.stringCodePointAt(visible, 0);
  return codePoint === undefined ? 0 : eastAsianCellWidth(codePoint) + measureTrailing(visible);
}

function addCellWidth(current: number, additional: number): number {
  return additional > MAX_TERMINAL_CELLS - current ? TERMINAL_CELL_OVERFLOW : current + additional;
}

function isPrintableAscii(input: string): boolean {
  for (let index = 0; index < input.length; index += 1) {
    const code = TextIntrinsic.stringCharCodeAt(input, index);
    if (code < 0x20 || code > 0x7e) return false;
  }
  return true;
}

function isDoubleWidthNonRgiEmoji(input: string): boolean {
  if (input.length > 50) return false;
  if (matches(UNQUALIFIED_KEYCAP_PATTERN, input)) return true;
  if (!TextIntrinsic.stringIncludes(input, '\u200D')) return false;

  let count = 0;
  EXTENDED_PICTOGRAPHIC_PATTERN.lastIndex = 0;
  while (TextIntrinsic.regexpExec(EXTENDED_PICTOGRAPHIC_PATTERN, input)) {
    if (++count >= 2) {
      EXTENDED_PICTOGRAPHIC_PATTERN.lastIndex = 0;
      return true;
    }
  }
  EXTENDED_PICTOGRAPHIC_PATTERN.lastIndex = 0;
  return false;
}

function measureHangulCluster(input: string): number | undefined {
  const codePoints = visibleCodePoints(input);
  if (codePoints.length === 0) return undefined;

  let width = 0;
  for (let index = 0; index < codePoints.length; index += 1) {
    const codePoint = codePoints[index];
    if (!isHangulJamo(codePoint)) {
      if (width === 0) return undefined;
      for (let remaining = index; remaining < codePoints.length; remaining += 1) {
        width += eastAsianCellWidth(codePoints[remaining]);
      }
      return width;
    }

    if (isHangulLeadingJamo(codePoint) && isHangulVowelJamo(codePoints[index + 1])) {
      width += 2;
      index += isHangulTrailingJamo(codePoints[index + 2]) ? 2 : 1;
      continue;
    }
    width += eastAsianCellWidth(codePoint);
  }
  return width;
}

function visibleCodePoints(input: string): readonly number[] {
  const output: number[] = [];
  for (let index = 0; index < input.length;) {
    const codePoint = TextIntrinsic.stringCodePointAt(input, index);
    if (codePoint === undefined) break;
    const character = TextIntrinsic.stringFromCodePoint(codePoint);
    if (!matches(ZERO_WIDTH_CLUSTER_PATTERN, character)) {
      TextIntrinsic.arrayPush(output, codePoint);
    }
    index += codePoint > 0xffff ? 2 : 1;
  }
  return output;
}

function measureTrailing(input: string): number {
  let width = 0;
  let first = true;
  for (let index = 0; index < input.length;) {
    const codePoint = TextIntrinsic.stringCodePointAt(input, index);
    if (codePoint === undefined) break;
    const character = TextIntrinsic.stringFromCodePoint(codePoint);
    if (first) {
      first = false;
    } else if (
      matches(SPACING_MARK_PATTERN, character) ||
      (codePoint >= 0xff00 && codePoint <= 0xffef)
    ) {
      width += eastAsianCellWidth(codePoint);
    }
    index += codePoint > 0xffff ? 2 : 1;
  }
  return width;
}

function isHangulLeadingJamo(codePoint: number | undefined): boolean {
  return codePoint !== undefined &&
    ((codePoint >= 0x1100 && codePoint <= 0x115f) ||
      (codePoint >= 0xa960 && codePoint <= 0xa97c));
}

function isHangulVowelJamo(codePoint: number | undefined): boolean {
  return codePoint !== undefined &&
    ((codePoint >= 0x1160 && codePoint <= 0x11a7) ||
      (codePoint >= 0xd7b0 && codePoint <= 0xd7c6));
}

function isHangulTrailingJamo(codePoint: number | undefined): boolean {
  return codePoint !== undefined &&
    ((codePoint >= 0x11a8 && codePoint <= 0x11ff) ||
      (codePoint >= 0xd7cb && codePoint <= 0xd7fb));
}

function isHangulJamo(codePoint: number): boolean {
  return isHangulLeadingJamo(codePoint) || isHangulVowelJamo(codePoint) ||
    isHangulTrailingJamo(codePoint);
}

function matches(pattern: RegExp, input: string): boolean {
  return TextIntrinsic.regexpExec(pattern, input) !== null;
}
