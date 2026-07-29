import type { t } from './common.ts';
import { ast } from './u/u.ast.ts';
import { heading, inlineCode, link, taskListItem, thematicBreak } from './u/u.node.ts';

/**
 * Type guards for Markdown syntax-tree values.
 */
export const MarkdownIs: t.Markdown.IsLib = {
  ast,
  heading,
  inlineCode,
  link,
  taskListItem,
  thematicBreak,
};
