import { default as Pkg } from '../../deno.json' with { type: 'json' };

export * from './libs.ts';
export { Pkg };

export type * as t from './t.ts';
