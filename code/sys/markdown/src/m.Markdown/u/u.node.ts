import { Is, Num, type t } from '../common.ts';

type NodeRecord = {
  readonly type?: unknown;
  readonly checked?: unknown;
  readonly children?: unknown;
  readonly depth?: unknown;
  readonly lang?: unknown;
  readonly meta?: unknown;
  readonly title?: unknown;
  readonly url?: unknown;
  readonly value?: unknown;
};

export const code: t.Markdown.IsLib['code'] = (
  input,
): input is Extract<t.Markdown.Node, { type: 'code' }> => {
  const node = record(input);
  return node?.type === 'code' &&
    Is.string(node.value) &&
    (Is.nil(node.lang) || Is.string(node.lang)) &&
    (Is.nil(node.meta) || Is.string(node.meta));
};

export const heading: t.Markdown.IsLib['heading'] = (
  input,
): input is Extract<t.Markdown.Node, { type: 'heading' }> => {
  const node = record(input);
  return node?.type === 'heading' &&
    Num.Is.int(node.depth) &&
    node.depth >= 1 &&
    node.depth <= 6 &&
    Is.array(node.children);
};

export const inlineCode: t.Markdown.IsLib['inlineCode'] = (
  input,
): input is Extract<t.Markdown.Node, { type: 'inlineCode' }> => {
  const node = record(input);
  return node?.type === 'inlineCode' && Is.string(node.value);
};

export const link: t.Markdown.IsLib['link'] = (
  input,
): input is Extract<t.Markdown.Node, { type: 'link' }> => {
  const node = record(input);
  return node?.type === 'link' &&
    Is.string(node.url) &&
    (Is.nil(node.title) || Is.string(node.title)) &&
    Is.array(node.children);
};

export const taskListItem: t.Markdown.IsLib['taskListItem'] = (
  input,
): input is Extract<t.Markdown.Node, { type: 'listItem' }> & { readonly checked: boolean } => {
  const node = record(input);
  return node?.type === 'listItem' && Is.bool(node.checked) && Is.array(node.children);
};

export const thematicBreak: t.Markdown.IsLib['thematicBreak'] = (
  input,
): input is Extract<t.Markdown.Node, { type: 'thematicBreak' }> => {
  return record(input)?.type === 'thematicBreak';
};

/**
 * Helpers:
 */
function record(input: unknown): NodeRecord | undefined {
  return Is.record<NodeRecord>(input) ? input : undefined;
}
