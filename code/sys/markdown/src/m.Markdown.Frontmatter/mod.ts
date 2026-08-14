/**
 * @module
 * Markdown frontmatter parsing primitives.
 */
import type { t } from './common.ts';
import { parse } from './u.parse.ts';

/** Markdown frontmatter parsing primitives. */
export const Frontmatter: t.MarkdownFrontmatter.Lib = Object.freeze({
  parse,
});
