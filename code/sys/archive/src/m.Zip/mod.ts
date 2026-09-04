/**
 * @module
 * Strict bounded ZIP32 inspection and integrity testing.
 */
import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { open } from './u/u.open.ts';

/**
 * ZIP archive tools.
 */
export const Zip: t.Zip.Lib = Object.freeze({ Is, open });
