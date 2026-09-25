import {
  assertTextPresentationAuthority,
  runTextPresentationAuthority,
  TextIntrinsic,
  TextNumeric,
} from './u.authority.ts';
import { Is, type t } from '../../common.ts';
import { terminalLines, terminalWords } from './u.ansi.ts';
import {
  addSourceCodeUnits,
  assertLineCount,
  assertOutputCodeUnits,
  canOutputCodeUnits,
} from './u.budget.ts';
import { nonNegativeInt, optionalPositiveInt } from './u.number.ts';
import {
  appendTerminalCellMeasurement,
  startTerminalCellMeasurement,
  type TerminalCellMeasurement,
} from '../u.width/u.measure.ts';

const PRESERVE_PATTERNS = [
  /^`[^`]+`[.:;]?$/,
  /^\$\s+\S+/,
  /^deno\s+(bundle|check|doc|fmt|install|lint|publish|run|task|test)\b/,
  /^https?:\/\/\S+$/,
] as const;
const LEADING_WHITESPACE_PATTERN = /^\s*/;

type WrapLineOptions = {
  indent: number;
  continuationIndent: number;
};

type OutputBudget = {
  codeUnits: number;
  lines: number;
};

/** Soft-wrap prose and join the resulting display lines with newlines. */
export function text(input: string, options: t.CliFormatText.Wrap.Options): string {
  assertTextPresentationAuthority();
  const output = lines(input, options);
  let codeUnits = TextNumeric.max(0, output.length - 1);
  for (let index = 0; index < output.length; index += 1) {
    codeUnits += output[index].length;
    assertOutputCodeUnits(codeUnits);
  }
  return TextIntrinsic.arrayJoin(output, '\n');
}

/** Soft-wrap prose into display lines while retaining explicit boundaries and preserved lines. */
export function lines(
  input: string,
  options: t.CliFormatText.Wrap.Options,
): readonly string[] {
  assertTextPresentationAuthority();
  const sourceInput = typeof input === 'string' ? input : '';
  addSourceCodeUnits(0, sourceInput);
  const source = terminalLines(sourceInput);
  const width = optionalPositiveInt(readOption(options, 'width')) ?? 0;
  const indent = nonNegativeInt(readOption(options, 'indent'), 0);
  const continuationIndent = nonNegativeInt(
    readOption(options, 'continuationIndent'),
    indent,
  );
  const preserve = readOption(options, 'preserve');
  const output: string[] = [];
  const outputBudget: OutputBudget = { codeUnits: 0, lines: 0 };
  let fenced = false;
  let fenceIndent = 0;
  assertMinimumOutput(source, indent, continuationIndent);

  for (let index = 0; index < source.length; index += 1) {
    const line = source[index];
    const lineIndent = output.length === 0 ? indent : continuationIndent;
    const fenceLine = TextIntrinsic.stringStartsWith(
      TextIntrinsic.stringTrimStart(line),
      '```',
    );

    if (fenced) {
      appendTextLine(output, outputBudget, line, fenceIndent);
      if (fenceLine) fenced = false;
      continue;
    }

    if (fenceLine) {
      fenceIndent = lineIndent;
      fenced = true;
      appendTextLine(output, outputBudget, line, lineIndent);
      continue;
    }

    if (shouldPreserveLine(line, preserve)) {
      appendTextLine(output, outputBudget, line, lineIndent);
      continue;
    }

    wrapLine(
      line,
      width,
      { indent: lineIndent, continuationIndent },
      output,
      outputBudget,
    );
  }

  return output;
}

/** Soft-wrapping implementation grouped by text and line output. */
export const Wrap: t.CliFormatText.Wrap.Lib = Object.freeze({ text, lines });

/**
 * Helpers:
 */
function wrapLine(
  input: string,
  width: number,
  options: WrapLineOptions,
  output: string[],
  outputBudget: OutputBudget,
): void {
  const text = TextIntrinsic.stringTrim(input);
  if (text.length === 0) {
    appendTextLine(output, outputBudget, '', 0);
    return;
  }

  if (width <= 0) {
    appendTextLine(output, outputBudget, input, options.indent);
    return;
  }
  if (
    canOutputCodeUnits(options.indent + input.length) &&
    measureLineStart(options.indent, '', input).width <= width
  ) {
    appendTextLine(output, outputBudget, input, options.indent);
    return;
  }

  const leading = TextIntrinsic.regexpExec(LEADING_WHITESPACE_PATTERN, input)?.[0] ?? '';
  const words = terminalWords(text);
  let lineWords: string[] = [];
  let lineCodeUnits = 0;
  let lineMeasurement = startTerminalCellMeasurement('');
  let currentIndent = options.indent;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    if (lineWords.length === 0) {
      TextIntrinsic.arrayPush(lineWords, word);
      lineCodeUnits = word.length;
      lineMeasurement = measureLineStart(currentIndent, leading, word);
      continue;
    }

    const candidateCodeUnits = lineMeasurement.codeUnits + 1 + word.length;
    const candidate = canOutputCodeUnits(candidateCodeUnits)
      ? appendTerminalCellMeasurement(lineMeasurement, ` ${word}`)
      : undefined;
    if (candidate && candidate.width <= width) {
      TextIntrinsic.arrayPush(lineWords, word);
      lineCodeUnits += word.length;
      lineMeasurement = candidate;
      continue;
    }

    appendWordsLine(output, outputBudget, lineWords, lineCodeUnits, currentIndent, leading);
    currentIndent = options.continuationIndent;
    lineWords = [word];
    lineCodeUnits = word.length;
    lineMeasurement = measureLineStart(currentIndent, leading, word);
  }

  if (lineWords.length > 0) {
    appendWordsLine(output, outputBudget, lineWords, lineCodeUnits, currentIndent, leading);
  }
}

function shouldPreserveLine(
  input: string,
  preserve: t.CliFormatText.Wrap.Preserve = 'default',
): boolean {
  const text = TextIntrinsic.stringTrim(input);
  if (text.length === 0 || preserve === 'none') return false;
  if (isPreserveFn(preserve)) {
    return runTextPresentationAuthority(() => preserve(input));
  }
  for (let index = 0; index < PRESERVE_PATTERNS.length; index += 1) {
    if (TextIntrinsic.regexpExec(PRESERVE_PATTERNS[index], text)) return true;
  }
  return false;
}

function isPreserveFn(
  input: t.CliFormatText.Wrap.Preserve,
): input is t.CliFormatText.Wrap.PreserveFn {
  return Is.func(input);
}

function assertMinimumOutput(
  source: readonly string[],
  indent: number,
  continuationIndent: number,
): void {
  let minimum = TextNumeric.max(0, source.length - 1);
  let fenced = false;
  let fenceIndent = 0;
  assertOutputCodeUnits(minimum);

  for (let index = 0; index < source.length; index += 1) {
    const line = source[index];
    const lineIndent = index === 0 ? indent : continuationIndent;
    const fenceLine = TextIntrinsic.stringStartsWith(
      TextIntrinsic.stringTrimStart(line),
      '```',
    );
    let prefix = lineIndent;

    if (fenced) {
      prefix = fenceIndent;
      if (fenceLine) fenced = false;
    } else if (fenceLine) {
      fenceIndent = lineIndent;
      fenced = true;
    }

    if (TextIntrinsic.stringTrim(line).length === 0) continue;
    minimum += prefix + 1;
    assertOutputCodeUnits(minimum);
  }
}

/** Measure a line prefix without allocating its full indentation run. ASCII spaces break between
 * one another, so all but the final indent cell are additive while the final space retains grapheme
 * context with source-leading whitespace and the first word.
 */
function measureLineStart(
  indent: number,
  leading: string,
  input: string,
): TerminalCellMeasurement {
  assertOutputCodeUnits(indent + leading.length + input.length);
  const finalizedIndent = TextNumeric.max(0, indent - 1);
  const context = indent === 0 ? `${leading}${input}` : ` ${leading}${input}`;
  return startTerminalCellMeasurement(context, finalizedIndent);
}

function appendTextLine(
  output: string[],
  budget: OutputBudget,
  input: string,
  indent: number,
): void {
  const prefixLength = input.length === 0 ? 0 : indent;
  reserveOutputLine(budget, prefixLength + input.length);
  const prefix = prefixLength === 0 ? '' : TextIntrinsic.stringRepeat(' ', prefixLength);
  TextIntrinsic.arrayPush(output, prefixLength === 0 ? input : `${prefix}${input}`);
}

function appendWordsLine(
  output: string[],
  budget: OutputBudget,
  words: readonly string[],
  wordCodeUnits: number,
  indent: number,
  leading: string,
): void {
  const spaces = TextNumeric.max(0, words.length - 1);
  reserveOutputLine(budget, indent + leading.length + wordCodeUnits + spaces);
  const text = TextIntrinsic.arrayJoin(words, ' ');
  const prefix = indent === 0 ? '' : TextIntrinsic.stringRepeat(' ', indent);
  TextIntrinsic.arrayPush(output, `${prefix}${leading}${text}`);
}

function reserveOutputLine(budget: OutputBudget, codeUnits: number): void {
  assertLineCount(budget.lines + 1);
  const separator = budget.lines === 0 ? 0 : 1;
  assertOutputCodeUnits(budget.codeUnits + separator + codeUnits);
  budget.lines += 1;
  budget.codeUnits += separator + codeUnits;
}

function readOption<K extends keyof t.CliFormatText.Wrap.Options>(
  options: t.CliFormatText.Wrap.Options,
  key: K,
): t.CliFormatText.Wrap.Options[K] {
  return runTextPresentationAuthority(() => options[key]);
}
