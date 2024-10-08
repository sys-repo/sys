import { default as pkg } from '../../deno.json' with { type: 'json' };

import type * as t from './t.ts';
export * from './libs.ts';

export type { t };

/**
 * Module metadata.
 */
export const Pkg: t.Pkg = pkg 
