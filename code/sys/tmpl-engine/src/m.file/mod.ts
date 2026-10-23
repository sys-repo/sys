/**
 * @module
 */
import type { TmplFileLib } from './t.ts';
import { update, updateJson } from './u.update.ts';

export const File: TmplFileLib = Object.freeze({
  update,
  updateJson,
});
