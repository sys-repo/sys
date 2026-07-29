import { Is, type t } from './common.ts';

type SourcePoint = t.Markdown.Position['start'] & { readonly offset: number };
type SourcePosition = t.Markdown.Position & {
  readonly start: SourcePoint;
  readonly end: SourcePoint;
};

/**
 * Immutable source-text lenses over positioned Markdown nodes.
 */
export const MarkdownSource: t.Markdown.Source.Lib = {
  slice,
  thematicBreak,
};

/**
 * Helpers:
 */
function slice(source: t.StringMarkdown, node: t.Markdown.Node): string | undefined {
  if (!Is.string(source)) return undefined;

  const span = sourceSpan(node);
  if (!span) return undefined;
  if (span.end > source.length) return undefined;

  return source.slice(span.start, span.end);
}

function thematicBreak(
  source: t.StringMarkdown,
  node: t.Markdown.Node,
): t.Markdown.Source.ThematicBreakLexeme | undefined {
  if (node.type !== 'thematicBreak') return undefined;

  const position = sourcePosition(node);
  if (!position) return undefined;

  const raw = slice(source, node);
  if (raw === undefined) return undefined;

  const markers = thematicBreakMarkers(raw);
  if (!markers) return undefined;

  return { raw, ...markers, position };
}

function thematicBreakMarkers(
  raw: string,
): Pick<t.Markdown.Source.ThematicBreakLexeme, 'marker' | 'count'> | undefined {
  let marker: t.Markdown.Source.ThematicBreakLexeme['marker'] | undefined;
  let count = 0;

  for (const char of raw) {
    if (char === ' ' || char === '\t') continue;
    if (!(char === '-' || char === '*' || char === '_')) return undefined;
    if (marker !== undefined && char !== marker) return undefined;
    marker = char;
    count++;
  }

  return marker && count >= 3 ? { marker, count } : undefined;
}

function sourceSpan(node: t.Markdown.Node) {
  const position = sourcePosition(node);
  if (!position) return undefined;

  const start = position.start.offset;
  const end = position.end.offset;
  if (end < start) return undefined;

  return { start, end } as const;
}

function sourcePosition(node: t.Markdown.Node): SourcePosition | undefined {
  const position = node.position;
  if (!Is.record(position)) return undefined;
  if (!isSourcePoint(position.start) || !isSourcePoint(position.end)) return undefined;
  return position as SourcePosition;
}

function isSourcePoint(input: unknown): input is SourcePoint {
  if (!Is.record(input)) return false;
  return isIntegerAtLeast(input.line, 1) &&
    isIntegerAtLeast(input.column, 1) &&
    isIntegerAtLeast(input.offset, 0);
}

function isIntegerAtLeast(input: unknown, min: number): input is number {
  return Is.number(input) && Number.isInteger(input) && input >= min;
}
