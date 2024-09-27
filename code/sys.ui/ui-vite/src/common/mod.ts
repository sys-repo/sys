import { default as pkg } from '../../deno.json' with { type: 'json' };
export * from './libs.ts';

/**
 * Module meta-data.
 */
export const Pkg = pkg;


export type * as t from './t.ts';
