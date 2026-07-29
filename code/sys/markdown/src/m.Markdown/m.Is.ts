import type { t } from './common.ts';
import { ast } from './u/u.ast.ts';

/**
 * Type guards for Markdown syntax-tree values.
 */
export const MarkdownIs: t.Markdown.IsLib = {
  ast,
};
