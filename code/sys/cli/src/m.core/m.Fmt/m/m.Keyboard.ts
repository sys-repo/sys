import { c, Is, type t } from '../common.ts';
import { Text } from '../../m.Fmt.Text/mod.ts';
import {
  assertTextPresentationAuthority,
  runTextPresentationAuthority,
  TextIntrinsic,
  TextNumeric,
} from '../../m.Fmt.Text/u/u.authority.ts';
import {
  addSourceCodeUnits,
  assertOutputCodeUnits,
  assertWidthCollectionLength,
} from '../../m.Fmt.Text/u/u.budget.ts';
import { MAX_TERMINAL_CELLS } from '../../u/u.layout.ts';

const MINIMUM_LANE_GAP = 2;
const MALFORMED_COLLECTION_LENGTH = TextIntrinsic.freeze(
  new Error('Cli.Fmt.Keyboard input length invalid.'),
);

type AdmittedCommand = Readonly<{
  readonly label: string;
  readonly keys: readonly string[];
  readonly context?: string;
}>;

type AdmittedCandidate = Readonly<{
  readonly right: string;
  readonly left?: string;
}>;

/**
 * Shared keyboard-command and keyboard-row presentation.
 */
export const Keyboard: t.CliFormatKeyboard.Lib = Object.freeze({ back, command, row });

/**
 * Helpers:
 */
function back(): string {
  assertTextPresentationAuthority();
  const result = `${c.cyan('←')} ${c.gray('ctrl')}`;
  assertOutputCodeUnits(result.length);
  return result;
}

function command(options: t.CliFormatKeyboard.Command.Options): string {
  assertTextPresentationAuthority();
  const admitted = admitCommand(options);
  const label = c.dim(c.gray(`${admitted.label}:`));
  const separator = ` ${c.dim(c.gray('or'))} `;
  const keys: string[] = [];
  let outputCodeUnits = addOutputCodeUnits(0, label.length + 1);

  for (let index = 0; index < admitted.keys.length; index += 1) {
    const key = c.bold(c.white(admitted.keys[index]));
    outputCodeUnits = addOutputCodeUnits(
      outputCodeUnits,
      key.length + (index === 0 ? 0 : separator.length),
    );
    TextIntrinsic.arrayPush(keys, key);
  }

  const context = admitted.context === undefined
    ? undefined
    : c.dim(c.gray(`(${admitted.context})`));
  if (context !== undefined) {
    outputCodeUnits = addOutputCodeUnits(outputCodeUnits, context.length + 1);
  }

  const rendered = `${label} ${TextIntrinsic.arrayJoin(keys, separator)}`;
  const result = context === undefined ? rendered : `${rendered} ${context}`;
  assertOutputCodeUnits(result.length);
  return result;
}

function row(options: t.CliFormatKeyboard.Row.Options): string | undefined {
  assertTextPresentationAuthority();
  const rawWidth: unknown = runTextPresentationAuthority(() => options.width);
  const width = normalizeWidth(rawWidth);
  if (width === undefined) return undefined;

  const candidates = admitCandidates(
    runTextPresentationAuthority(() => options.candidates),
  );
  for (let index = 0; index < candidates.length; index += 1) {
    const { left, right } = candidates[index];
    const rightWidth = Text.Width.measure(right);
    if (left === undefined) {
      if (rightWidth <= width) return renderRight(right, rightWidth, width);
      continue;
    }

    const leftWidth = Text.Width.measure(left);
    const gap = width - leftWidth - rightWidth;
    if (gap >= MINIMUM_LANE_GAP) return renderSplit(left, right, gap);
  }

  return undefined;
}

function admitCommand(options: t.CliFormatKeyboard.Command.Options): AdmittedCommand {
  const rawLabel: unknown = runTextPresentationAuthority(() => options.label);
  const label = Is.string(rawLabel) ? rawLabel : '';
  let sourceCodeUnits = addSourceCodeUnits(0, label);

  const source = runTextPresentationAuthority(() => options.keys);
  const length = admitCollectionLength(source);
  const keys: string[] = [];
  for (let index = 0; index < length; index += 1) {
    const rawKey: unknown = runTextPresentationAuthority(() => source[index]);
    const key = Is.string(rawKey) ? rawKey : '';
    sourceCodeUnits = addSourceCodeUnits(sourceCodeUnits, key);
    TextIntrinsic.arrayPush(keys, key);
  }

  const rawContext: unknown = runTextPresentationAuthority(() => options.context);
  const context = Is.string(rawContext) ? rawContext : undefined;
  if (context !== undefined) sourceCodeUnits = addSourceCodeUnits(sourceCodeUnits, context);
  return { label, keys, context };
}

function admitCandidates(source: t.CliFormatKeyboard.Row.Candidate[]): AdmittedCandidate[] {
  const length = admitCollectionLength(source);
  const candidates: AdmittedCandidate[] = [];
  let sourceCodeUnits = 0;

  for (let index = 0; index < length; index += 1) {
    const candidate = runTextPresentationAuthority(() => source[index]);
    if (!candidate) continue;

    const rawRight: unknown = runTextPresentationAuthority(() => candidate.right);
    const rawLeft: unknown = runTextPresentationAuthority(() => candidate.left);
    const right = Is.string(rawRight) ? rawRight : '';
    const left = Is.string(rawLeft) ? rawLeft : undefined;
    sourceCodeUnits = addSourceCodeUnits(sourceCodeUnits, right);
    if (left !== undefined) sourceCodeUnits = addSourceCodeUnits(sourceCodeUnits, left);
    TextIntrinsic.arrayPush(candidates, { left, right });
  }

  return candidates;
}

function admitCollectionLength(source: { readonly length: number }): number {
  const rawLength: unknown = runTextPresentationAuthority(() => source.length);
  if (!Is.number(rawLength) || !TextIntrinsic.numberIsFinite(rawLength)) {
    throw MALFORMED_COLLECTION_LENGTH;
  }
  const length = TextNumeric.floor(rawLength);
  if (length <= 0) return 0;
  assertWidthCollectionLength(length);
  return length;
}

function normalizeWidth(input: unknown): number | undefined {
  if (!Is.number(input) || !TextIntrinsic.numberIsFinite(input)) return undefined;
  const width = TextNumeric.floor(input);
  return width > 0 && width <= MAX_TERMINAL_CELLS ? width : undefined;
}

function addOutputCodeUnits(current: number, addition: number): number {
  const output = current + addition;
  assertOutputCodeUnits(output);
  return output;
}

function renderRight(right: string, rightWidth: number, width: number): string {
  const padding = Text.Width.padEnd('', width - rightWidth);
  assertOutputCodeUnits(padding.length + right.length);
  return `${padding}${right}`;
}

function renderSplit(left: string, right: string, gap: number): string {
  const padding = Text.Width.padEnd('', gap);
  assertOutputCodeUnits(left.length + padding.length + right.length);
  return `${left}${padding}${right}`;
}
