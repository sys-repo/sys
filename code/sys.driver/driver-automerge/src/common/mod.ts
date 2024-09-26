import { default as Pkg } from '../../deno.json' with { type: 'json' };

/**
 * @module
 */
export * from './libs.ts';
export { Pkg };

export type * as t from './t.ts';
