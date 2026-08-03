/**
 * @module
 * Materialize an externally pinned `dist.json` and its assets as an immutable local generation.
 *
 * The caller supplies the exact manifest checksum, storage root, and finite acquisition and
 * verification policy. The manifest pin authenticates its asset declarations; every success carries
 * fresh verification evidence for the exact returned directory.
 *
 * This module never discovers or synthesizes the pin, selects a current version, or activates the
 * generation.
 */
import type { t } from './common.ts';
import { materialize } from './u.materialize.ts';

export type * from './t.ts';

/**
 * Server-owned checksum-pinned Dist materialization.
 */
export const Dist: t.ServerDist.Lib = Object.freeze({ materialize });
