import { default as pkg } from '../../deno.json' with { type: 'json' };
export * from './libs.ts';

/**
 * Module meta-data.
 */
export const Pkg = pkg;
export type * as t from './t.ts';

/**
 * Determine if the value is of type Object.
 */
export function isObject(input: any): input is object {
  return typeof input === 'object' && input !== null;
}
