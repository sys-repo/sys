import { Pkg, type t } from '@sys/std';
import { default as deno } from '../deno.json' with { type: 'json' };


/**
 * Package meta-data.
 */
export const pkg: t.Pkg = Pkg.fromJson(deno);
