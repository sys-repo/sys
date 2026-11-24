import { Markdown, type t } from './common.ts';

type Children = readonly t.Markdown.Node[];

/** Parse once, retaining the unchanged source/tree pair inside this owner. */
export function parseLabel(value: string): readonly t.LabelInline[] {
  return fromParsed(value, Markdown.parse(value, { flavor: 'commonmark' }));
}

/** Internal recovery seam for testing failed parses/spans; not a public AST-input API. */
export function fromParsed(
  value: string,
  parsed: t.Markdown.ParseResult,
): readonly t.LabelInline[] {
  const literal: readonly t.LabelInline[] = [{ kind: 'text', value }];
  const root = parsed.data;
  if (!root || root.children.length !== 1) return literal;
  const paragraph = root.children[0];
  if (paragraph.type !== 'paragraph') return literal;
  return inline(value, paragraph, paragraph.children) ?? literal;
}

/** Only validate the inline subset and its source spans, not arbitrary MDAST input. */
function inline(
  source: string,
  parent: t.Markdown.Node,
  children: Children,
): readonly t.LabelInline[] | undefined {
  const start = parent.position?.start.offset;
  const end = parent.position?.end.offset;
  if (start === undefined || end === undefined) return undefined;
  let previousEnd = start;
  const result: t.LabelInline[] = [];
  for (const node of children) {
    const raw = Markdown.Source.slice(source, node);
    const nodeStart = node.position?.start.offset;
    const nodeEnd = node.position?.end.offset;
    // Source.slice validates offsets; containment and ordering catch inconsistent recovery spans.
    if (!raw || nodeStart === undefined || nodeEnd === undefined) return undefined;
    if (nodeStart < previousEnd || nodeEnd > end) return undefined;
    previousEnd = nodeEnd;

    switch (node.type) {
      case 'text':
        result.push({ kind: 'text', value: node.value });
        break;
      case 'inlineCode':
        result.push({ kind: 'code', value: node.value });
        break;
      case 'strong':
      case 'emphasis': {
        const children = inline(source, node, node.children);
        if (!children) return undefined;
        result.push({ kind: node.type, children });
        break;
      }
      default:
        result.push({ kind: 'text', value: raw });
    }
  }
  return result;
}
