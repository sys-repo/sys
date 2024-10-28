import { default as deno } from '../deno.json' with { type: 'json' };
import { Pkg } from './m.Pkg/mod.ts';

/**
 * Package meta-data.
 */
export const pkg = Pkg.fromJson(deno)
