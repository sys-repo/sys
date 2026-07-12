/**
 * @module
 * Minimal XML parsing facade with data-first parse failures.
 */
import { type t } from './common.ts';
import { Is } from './m.Is.ts';
import { parse } from './u.parse.ts';

/** Minimal XML parsing facade. */
export const Xml: t.Xml.Lib = {
  parse,
  Is,
};
