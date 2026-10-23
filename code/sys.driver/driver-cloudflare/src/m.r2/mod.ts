/**
 * @module Cloudflare R2 integration.
 */
import type { t } from './common.ts';
import { Files } from './m.Files/mod.ts';
import { ReadRoute } from './m.ReadRoute/mod.ts';
import { Service } from './m.Service/mod.ts';
import { R2Error as Error } from './u/u.diagnostic.ts';

/**
 * Cloudflare R2 runtime API.
 */
export const R2: t.R2.Lib = {
  Service,
  Error,
  Files,
  ReadRoute,
};
