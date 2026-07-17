/**
 * @module
 * Markdown parsing, serialization, and safe rendering primitives.
 */
import type { t } from './common.ts';
import { MarkdownIs as Is } from './m.Is.ts';
import { Html } from '../m.Markdown.Html/mod.ts';
import { parse } from './u/u.parse.ts';
import { stringify } from './u/u.stringify.ts';

/** Markdown parsing, serialization, and safe rendering primitives. */
export const Markdown: t.Markdown.Lib = {
  Is,
  Html,
  parse,
  stringify,
};
