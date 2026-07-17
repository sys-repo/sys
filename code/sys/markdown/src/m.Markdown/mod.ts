/**
 * @module
 * Markdown parsing and serialization primitives.
 */
import type { t } from './common.ts';
import { MarkdownIs as Is } from './m.Is.ts';
import { parse } from './u/u.parse.ts';
import { stringify } from './u/u.stringify.ts';

/** Markdown parsing and serialization primitives. */
export const Markdown: t.Markdown.Lib = {
  Is,
  parse,
  stringify,
};
