import type { Pkg as TPkg } from '@sys/types';
import { default as deno } from '../deno.json' with { type: 'json' };
import { Pkg } from './m.Pkg/mod.ts';

/**
 * Package meta-data.
*/
export const pkg: TPkg = Pkg.fromJson(deno)
