import { Is, type t } from '../common.ts';

export type MarkdownNodeRecord = {
  readonly type: string;
  readonly children?: readonly unknown[];
  readonly value?: unknown;
  readonly checked?: unknown;
  readonly ordered?: unknown;
  readonly start?: unknown;
  readonly url?: unknown;
  readonly title?: unknown;
};

export type NodeWithChildren = MarkdownNodeRecord & { readonly children: readonly unknown[] };
export type TaskListItemNode = t.ProseMarkdown.Block.TaskState.Node;

export function isMarkdownNodeRecord(input: unknown): input is MarkdownNodeRecord {
  return Is.record<{ readonly type?: unknown }>(input) && Is.string(input.type);
}

export function isInlineCodeNode(
  node: MarkdownNodeRecord,
): node is t.ProseMarkdown.Inline.Code.Node {
  return node.type === 'inlineCode' && Is.string(node.value);
}

export function isLinkNode(node: MarkdownNodeRecord): node is t.ProseMarkdown.Inline.Link.Node {
  const title = node.title;
  return node.type === 'link' &&
    Is.string(node.url) &&
    (title === undefined || title === null || Is.string(title)) &&
    Is.array<unknown>(node.children);
}

export function isTaskListItemNode(node: MarkdownNodeRecord): node is TaskListItemNode {
  return node.type === 'listItem' && Is.bool(node.checked) && Is.array<unknown>(node.children);
}

export function hasRenderableChildren(node: MarkdownNodeRecord): node is NodeWithChildren {
  return Is.array<unknown>(node.children);
}
