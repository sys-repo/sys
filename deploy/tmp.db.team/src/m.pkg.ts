import type { t } from '@sys/types';
import { default as pkg } from '../deno.json' with { type: 'json' };

/**
 * Meta-data.
 */
export const Pkg = pkg as t.Pkg
