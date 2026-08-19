// Establish captured presentation authority before initializing private RegExp state.
import { TextIntrinsic } from './u.authority.ts';
import { assertLineCount } from './u.budget.ts';

/**
 * Owned ANSI recognition adapted from string-width@8.2.2 and its ansi-regex@6.2.2 path.
 * Upstream license: ./LICENSE.sindresorhus.txt
 */
const ANSI_CSI =
  '[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]';
const ANSI_CSI_PATTERN = new RegExp(ANSI_CSI, 'y');
const WHITESPACE_PATTERN = /\s/y;

const ESCAPE = 0x1b;
const CONTROL_SEQUENCE_INTRODUCER = 0x9b;
const OSC = 0x5d;
const STRING_TERMINATOR = 0x9c;
const BELL = 0x07;
const BACKSLASH = 0x5c;
const CARRIAGE_RETURN = 0x0d;
const LINE_FEED = 0x0a;

type ScanState = {
  oscTerminatorAbsent: boolean;
};

/** Remove complete ANSI control sequences without exposing mutable scanner state. */
export function stripAnsi(input: string): string {
  const output: string[] = [];
  const state: ScanState = { oscTerminatorAbsent: false };
  let plainStart = 0;
  let index = 0;

  while (index < input.length) {
    const end = ansiSequenceEnd(input, index, state);
    if (end === undefined) {
      index += 1;
      continue;
    }

    if (plainStart < index) {
      TextIntrinsic.arrayPush(output, TextIntrinsic.stringSlice(input, plainStart, index));
    }
    index = end;
    plainStart = end;
  }

  if (plainStart < input.length) {
    TextIntrinsic.arrayPush(output, TextIntrinsic.stringSlice(input, plainStart, input.length));
  }
  return TextIntrinsic.arrayJoin(output, '');
}

/**
 * Split external source lines while retaining complete ANSI controls byte-for-byte. Leading and
 * trailing edge-newline normalization applies only to plain whitespace outside those controls.
 */
export function terminalLines(input: string): readonly string[] {
  const rawLines: string[] = [];
  const whitespaceOnly: boolean[] = [];
  const state: ScanState = { oscTerminatorAbsent: false };
  let fragments: string[] = [];
  let lineIsWhitespace = true;
  let spanStart = 0;
  let index = 0;

  // The main cursor advances monotonically. One failed OSC lookahead may inspect the remaining
  // suffix once; its state then proves no later opener in that suffix can have a terminator.
  while (index < input.length) {
    const ansiEnd = ansiSequenceEnd(input, index, state);
    if (ansiEnd !== undefined) {
      appendSlice(fragments, input, spanStart, index);
      TextIntrinsic.arrayPush(fragments, TextIntrinsic.stringSlice(input, index, ansiEnd));
      lineIsWhitespace = false;
      index = ansiEnd;
      spanStart = ansiEnd;
      continue;
    }

    const code = TextIntrinsic.stringCharCodeAt(input, index);
    const crlf = code === CARRIAGE_RETURN &&
      TextIntrinsic.stringCharCodeAt(input, index + 1) === LINE_FEED;
    if (code === LINE_FEED || crlf) {
      appendSlice(fragments, input, spanStart, index);
      appendRawLine(rawLines, whitespaceOnly, fragments, lineIsWhitespace);
      fragments = [];
      lineIsWhitespace = true;
      index += crlf ? 2 : 1;
      spanStart = index;
      continue;
    }

    const whitespaceLength = whitespaceAt(input, index);
    if (whitespaceLength === 0) lineIsWhitespace = false;
    index += whitespaceLength || 1;
  }

  appendSlice(fragments, input, spanStart, input.length);
  appendRawLine(rawLines, whitespaceOnly, fragments, lineIsWhitespace);

  let start = 0;
  while (start < rawLines.length - 1 && whitespaceOnly[start]) start += 1;

  let end = rawLines.length;
  while (end - start > 1 && whitespaceOnly[end - 1]) end -= 1;

  const output: string[] = [];
  for (let line = start; line < end; line += 1) {
    TextIntrinsic.arrayPush(output, rawLines[line]);
  }
  return output;
}

/**
 * Split prose at visible whitespace while retaining whitespace contained by complete ANSI control
 * sequences inside its surrounding terminal word.
 */
export function terminalWords(input: string): readonly string[] {
  const output: string[] = [];
  const state: ScanState = { oscTerminatorAbsent: false };
  let wordStart = -1;
  let index = 0;

  while (index < input.length) {
    const ansiEnd = ansiSequenceEnd(input, index, state);
    if (ansiEnd !== undefined) {
      if (wordStart < 0) wordStart = index;
      index = ansiEnd;
      continue;
    }

    const whitespaceLength = whitespaceAt(input, index);
    if (whitespaceLength > 0) {
      if (wordStart >= 0) {
        TextIntrinsic.arrayPush(output, TextIntrinsic.stringSlice(input, wordStart, index));
        wordStart = -1;
      }
      index += whitespaceLength;
      continue;
    }

    if (wordStart < 0) wordStart = index;
    index += 1;
  }

  if (wordStart >= 0) {
    TextIntrinsic.arrayPush(output, TextIntrinsic.stringSlice(input, wordStart, input.length));
  }
  return output;
}

TextIntrinsic.freeze(stripAnsi);
TextIntrinsic.freeze(terminalLines);
TextIntrinsic.freeze(terminalWords);

function appendSlice(output: string[], input: string, start: number, end: number): void {
  if (start < end) TextIntrinsic.arrayPush(output, TextIntrinsic.stringSlice(input, start, end));
}

function appendRawLine(
  output: string[],
  whitespaceOnly: boolean[],
  fragments: readonly string[],
  lineIsWhitespace: boolean,
): void {
  assertLineCount(output.length + 1);
  TextIntrinsic.arrayPush(output, TextIntrinsic.arrayJoin(fragments, ''));
  TextIntrinsic.arrayPush(whitespaceOnly, lineIsWhitespace);
}

function ansiSequenceEnd(
  input: string,
  index: number,
  state: ScanState,
): number | undefined {
  const lead = TextIntrinsic.stringCharCodeAt(input, index);
  if (lead !== ESCAPE && lead !== CONTROL_SEQUENCE_INTRODUCER) return;

  if (
    !state.oscTerminatorAbsent &&
    lead === ESCAPE &&
    TextIntrinsic.stringCharCodeAt(input, index + 1) === OSC
  ) {
    const end = oscSequenceEnd(input, index + 2);
    if (end !== undefined) return end;
    state.oscTerminatorAbsent = true;
  }

  ANSI_CSI_PATTERN.lastIndex = index;
  const match = TextIntrinsic.regexpExec(ANSI_CSI_PATTERN, input);
  ANSI_CSI_PATTERN.lastIndex = 0;
  return match ? index + match[0].length : undefined;
}

function oscSequenceEnd(input: string, start: number): number | undefined {
  for (let index = start; index < input.length; index += 1) {
    const code = TextIntrinsic.stringCharCodeAt(input, index);
    if (code === BELL || code === STRING_TERMINATOR) return index + 1;
    if (
      code === ESCAPE &&
      TextIntrinsic.stringCharCodeAt(input, index + 1) === BACKSLASH
    ) {
      return index + 2;
    }
  }
}

function whitespaceAt(input: string, index: number): number {
  WHITESPACE_PATTERN.lastIndex = index;
  const match = TextIntrinsic.regexpExec(WHITESPACE_PATTERN, input);
  WHITESPACE_PATTERN.lastIndex = 0;
  return match?.[0].length ?? 0;
}
