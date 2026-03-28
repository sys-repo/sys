/**
 * @module
 * npm registry server adapter.
 */
import type { t } from './common.ts';
import { Npm as Base } from '../m.client/mod.ts';

export const Npm: t.NpmServerLib = {
  ...Base,
};
