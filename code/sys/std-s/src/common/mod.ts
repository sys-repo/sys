import { default as Pkg } from '../../deno.json' with { type: 'json' };

/**
 * @ext
 */
export * from '@sys/std';


/**
 * @module
 */
export type * as t from './t.ts';
export { Pkg };

