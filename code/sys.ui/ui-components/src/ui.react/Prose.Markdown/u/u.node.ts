import { Is, type t } from '../common.ts';

export type MarkdownNodeRecord = {
  readonly type: string;
  readonly children?: readonly unknown[];
  readonly value?: unknown;
  readonly ordered?: unknown;
  readonly start?: unknown;
  readonly url?: unknown;
  readonly title?: unknown;
};

export type NodeWithChildren = MarkdownNodeRecord & { readonly children: readonly unknown[] };

export function isMarkdownNodeRecord(input: unknown): input is MarkdownNodeRecord {
  return Is.record<{ readonly type?: unknown }>(input) && Is.string(input.type);
}

export function isInlineCodeNode(
  node: MarkdownNodeRecord,
): node is t.ProseMarkdown.Inline.Code.Node {
  return node.type === 'inlineCode' && Is.string(node.value);
}

export function hasRenderableChildren(node: MarkdownNodeRecord): node is NodeWithChildren {
  return Is.array<unknown>(node.children);
}
