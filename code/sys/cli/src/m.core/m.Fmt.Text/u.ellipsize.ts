import {
  assertTextPresentationAuthority,
  runTextPresentationAuthority,
  TextIntrinsic,
  TextNumeric,
} from './u.authority.ts';
import type { t } from '../common.ts';
import { addSourceCodeUnits, assertOutputCodeUnits } from './u.budget.ts';
import { nonNegativeInt } from './u.number.ts';
import { measureAdmitted } from './u.width.ts';

type Grapheme = {
  readonly text: string;
  readonly width: number;
};

type Selection = {
  readonly headCount: number;
  readonly headWidth: number;
  readonly tailCount: number;
  readonly tailWidth: number;
};

/**
 * Grapheme-safe middle clipping for plain, single-line text within a terminal-cell budget.
 *
 * Retains as many cells as possible, balances the retained ends, and favors the head on ties.
 * An optional renderer receives the final plain fragments only when clipping occurs.
 */
export function ellipsize(
  input: string,
  width: number,
  options: t.CliFormatText.Ellipsize.Options = {},
): string {
  assertTextPresentationAuthority();
  const text = typeof input === 'string' ? input : '';
  const sourceCodeUnits = addSourceCodeUnits(0, text);
  const budget = nonNegativeInt(width, 0);
  if (budget === 0) return '';
  if (measureAdmitted(text) <= budget) return text;

  const markerInput: unknown = readOption(options, 'ellipsis');
  const marker = typeof markerInput === 'string' ? markerInput : '…';
  addSourceCodeUnits(sourceCodeUnits, marker);
  const markerWidth = measureAdmitted(marker);
  if (markerWidth > budget) {
    return renderParts({ head: '', ellipsis: clipStart(marker, budget), tail: '' }, options);
  }
  if (markerWidth === budget) {
    return renderParts({ head: '', ellipsis: marker, tail: '' }, options);
  }

  const items = graphemes(text);
  const selected = selectEnds(items, budget - markerWidth);
  const head = joinItems(items, 0, selected.headCount);
  const tail = joinItems(items, items.length - selected.tailCount, items.length);
  return renderParts({ head, ellipsis: marker, tail }, options);
}

/**
 * Helpers:
 */
function renderParts(
  source: t.CliFormatText.Ellipsize.Parts,
  options: t.CliFormatText.Ellipsize.Options,
): string {
  assertOutputCodeUnits(source.head.length + source.ellipsis.length + source.tail.length);
  const fallback = `${source.head}${source.ellipsis}${source.tail}`;
  const parts = TextIntrinsic.freeze({ ...source });
  const render: unknown = readOption(options, 'render');
  if (typeof render !== 'function') return fallback;
  const output: unknown = runTextPresentationAuthority(() => render(parts));
  if (typeof output !== 'string') return fallback;
  assertOutputCodeUnits(output.length);
  return output;
}

function graphemes(input: string): Grapheme[] {
  const output: Grapheme[] = [];
  TextIntrinsic.forEachSegment(input, (text) => {
    TextIntrinsic.arrayPush(
      output,
      TextIntrinsic.freeze({
        text,
        width: measureAdmitted(text),
      }),
    );
  });
  return output;
}

function clipStart(input: string, budget: number): string {
  const output: string[] = [];
  let outputCodeUnits = 0;
  let width = 0;
  TextIntrinsic.forEachSegment(input, (text) => {
    const itemWidth = measureAdmitted(text);
    if (width + itemWidth > budget) return false;
    outputCodeUnits += text.length;
    assertOutputCodeUnits(outputCodeUnits);
    TextIntrinsic.arrayPush(output, text);
    width += itemWidth;
  });
  return TextIntrinsic.arrayJoin(output, '');
}

function joinItems(items: readonly Grapheme[], start: number, end: number): string {
  const output: string[] = [];
  let outputCodeUnits = 0;
  for (let index = start; index < end; index += 1) {
    const text = items[index].text;
    outputCodeUnits += text.length;
    assertOutputCodeUnits(outputCodeUnits);
    TextIntrinsic.arrayPush(output, text);
  }
  return TextIntrinsic.arrayJoin(output, '');
}

function selectEnds(items: readonly Grapheme[], budget: number): Selection {
  // Maximize retained cells, then balance both ends and favor the head on exact ties.
  const suffixWidths = [0];
  for (let index = items.length - 1; index >= 0; index--) {
    const width = suffixWidths[suffixWidths.length - 1] ?? 0;
    TextIntrinsic.arrayPush(suffixWidths, width + items[index].width);
  }

  let best: Selection | undefined;
  let headWidth = 0;
  let tailCount = items.length;

  for (let headCount = 0; headCount <= items.length; headCount++) {
    if (headCount > 0) headWidth += items[headCount - 1].width;
    if (headWidth > budget) break;

    while (
      tailCount > items.length - headCount ||
      headWidth + suffixWidths[tailCount] > budget
    ) {
      tailCount--;
    }

    const candidate: Selection = {
      headCount,
      headWidth,
      tailCount,
      tailWidth: suffixWidths[tailCount],
    };
    if (isBetter(candidate, best)) best = candidate;
  }

  return best ?? { headCount: 0, headWidth: 0, tailCount: 0, tailWidth: 0 };
}

function isBetter(candidate: Selection, current?: Selection): boolean {
  if (!current) return true;

  const used = candidate.headWidth + candidate.tailWidth;
  const currentUsed = current.headWidth + current.tailWidth;
  if (used !== currentUsed) return used > currentUsed;

  const balance = TextNumeric.abs(candidate.headWidth - candidate.tailWidth);
  const currentBalance = TextNumeric.abs(current.headWidth - current.tailWidth);
  if (balance !== currentBalance) return balance < currentBalance;

  if (candidate.headWidth !== current.headWidth) {
    return candidate.headWidth > current.headWidth;
  }

  return candidate.headCount > current.headCount;
}

function readOption<K extends keyof t.CliFormatText.Ellipsize.Options>(
  options: t.CliFormatText.Ellipsize.Options,
  key: K,
): t.CliFormatText.Ellipsize.Options[K] {
  return runTextPresentationAuthority(() => options[key]);
}
