import type { t } from '../common.ts';
import { nonNegativeInt } from './u.number.ts';
import { visibleWidth } from './u.width.ts';

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

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Middle-ellipsize plain single-line text within a terminal-cell budget. */
export function ellipsize(
  input: string,
  width: number,
  options: t.CliFormatTextEllipsizeOptions = {},
): string {
  const budget = nonNegativeInt(width, 0);
  if (budget === 0) return '';
  if (visibleWidth(input) <= budget) return input;

  const marker = options.ellipsis ?? '…';
  const markerWidth = visibleWidth(marker);
  if (markerWidth > budget) return clipStart(marker, budget);
  if (markerWidth === budget) return marker;

  const items = graphemes(input);
  const selected = selectEnds(items, budget - markerWidth);
  const head = items.slice(0, selected.headCount).map((item) => item.text).join('');
  const tail = selected.tailCount === 0
    ? ''
    : items.slice(items.length - selected.tailCount).map((item) => item.text).join('');

  return `${head}${marker}${tail}`;
}

/**
 * Helpers:
 */
function graphemes(input: string): readonly Grapheme[] {
  return [...segmenter.segment(input)].map(({ segment }) => ({
    text: segment,
    width: visibleWidth(segment),
  }));
}

function clipStart(input: string, budget: number): string {
  const selected: string[] = [];
  let width = 0;

  for (const item of graphemes(input)) {
    if (width + item.width > budget) break;
    selected.push(item.text);
    width += item.width;
  }

  return selected.join('');
}

function selectEnds(items: readonly Grapheme[], budget: number): Selection {
  // Maximize retained cells, then balance both ends and favor the head on exact ties.
  const suffixWidths = [0];
  for (let index = items.length - 1; index >= 0; index--) {
    const width = suffixWidths[suffixWidths.length - 1] ?? 0;
    suffixWidths.push(width + items[index]!.width);
  }

  let best: Selection | undefined;
  let headWidth = 0;
  let tailCount = items.length;

  for (let headCount = 0; headCount <= items.length; headCount++) {
    if (headCount > 0) headWidth += items[headCount - 1]!.width;
    if (headWidth > budget) break;

    while (
      tailCount > items.length - headCount ||
      headWidth + suffixWidths[tailCount]! > budget
    ) {
      tailCount--;
    }

    const candidate: Selection = {
      headCount,
      headWidth,
      tailCount,
      tailWidth: suffixWidths[tailCount]!,
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

  const balance = Math.abs(candidate.headWidth - candidate.tailWidth);
  const currentBalance = Math.abs(current.headWidth - current.tailWidth);
  if (balance !== currentBalance) return balance < currentBalance;

  if (candidate.headWidth !== current.headWidth) {
    return candidate.headWidth > current.headWidth;
  }

  return candidate.headCount > current.headCount;
}
