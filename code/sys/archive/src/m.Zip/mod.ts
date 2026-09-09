/**
 * @module
 * Strict bounded ZIP32 inspection, integrity testing, and extraction through a tree sink.
 */
import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { open } from './u/u.open.ts';

/**
 * ZIP archive tools.
 */
export const Zip: t.Zip.Lib = Object.freeze({ Is, open });
