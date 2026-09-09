import { type t } from './common.ts';
import { TextUpdate } from '../m.update/mod.ts';
import { invalidState, validateMarkers } from './u.validate.ts';

/** Detect a single exact-marker block in text. */
export const detect: t.TextBlock.Detect = (args) => {
  const invalid = validateMarkers(args.markers);
  if (invalid) return invalidState('invalid-markers', invalid);

  const spans = TextUpdate.lineSpans(args.text);
  const starts = markerSpans(spans, args.markers.start);
  const ends = markerSpans(spans, args.markers.end);

  if (starts.length === 0 && ends.length === 0) return { kind: 'missing' };
  if (starts.length > 1 || ends.length > 1) {
    return invalidState('multiple-blocks', 'Expected at most one start marker and one end marker');
  }
  if (starts.length !== ends.length) {
    return invalidState('partial-markers', 'Expected both start and end markers');
  }

  const start = starts[0]!;
  const end = ends[0]!;
  if (end.range.start < start.range.start) {
    return invalidState('reversed-markers', 'End marker appears before start marker');
  }

  const range = { start: start.range.start, end: end.range.end };
  const contentRange = { start: start.range.end, end: end.range.start };
  const block = args.text.slice(range.start, range.end);
  const content = args.text.slice(contentRange.start, contentRange.end);
  const newline = blockNewline(args.text, spans, start.index, end.index);

  return { kind: 'present', range, contentRange, block, content, newline };
};

/**
 * Helpers:
 */
function markerSpans(
  spans: readonly t.TextUpdate.Line.Span[],
  marker: string,
): readonly t.TextUpdate.Line.Span[] {
  return spans.filter((span) => span.text === marker);
}

function blockNewline(
  text: string,
  spans: readonly t.TextUpdate.Line.Span[],
  startIndex: number,
  endIndex: number,
): t.TextBlock.Newline {
  for (let index = startIndex; index <= endIndex; index++) {
    const newline = spans[index]?.newline;
    if (newline) return newline;
  }
  return TextUpdate.newlineOf(text);
}
