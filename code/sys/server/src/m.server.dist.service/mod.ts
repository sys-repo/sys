/**
 * @module
 * Cell-compatible content-pinned Dist lifecycle endpoint.
 */
import type { t } from './common.ts';
import { start } from './m.start.ts';
import { resources } from './u/u.resources.ts';

/**
 * Cell-compatible content-pinned Dist service.
 */
export const DistService: t.DistService.Lib = Object.freeze({ start, resources });
