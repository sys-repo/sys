/**
 * @module
 * npm registry server adapter.
 */
import type { t } from './common.ts';
import { Npm as Base } from '../m.client/mod.ts';

/** Server-side npm registry adapter. */
export const Npm: t.NpmServer.Lib = Object.freeze({
  ...Base,
});
