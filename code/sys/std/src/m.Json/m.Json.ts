import type { t } from './common.ts';
import { circularReplacer } from './u.circularReplacer.ts';
import { parse, safeParse } from './u.parse.ts';
import { stringify } from './u.stringify.ts';

/**
 * Helpers for working with JavaScript Object Notation ("JSON")
 * Standard: RFC-8259.
 */
export const Json: t.Json.Lib = Object.freeze({
  circularReplacer,
  stringify,
  parse,
  safeParse,
});
