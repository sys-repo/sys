/**
 * @module
 * Markdown parsing, serialization, frontmatter, and safe rendering primitives.
 */
import type { t } from './common.ts';
import { Frontmatter } from '../m.Markdown.Frontmatter/mod.ts';
import { Html } from '../m.Markdown.Html/mod.ts';
import { MarkdownIs as Is } from './m.Is.ts';
import { parse } from './u/u.parse.ts';
import { stringify } from './u/u.stringify.ts';

/** Markdown parsing, serialization, frontmatter, and safe rendering primitives. */
export const Markdown: t.Markdown.Lib = {
  Frontmatter,
  Html,
  Is,
  parse,
  stringify,
};
