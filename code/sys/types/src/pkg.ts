import type {  t } from '@sys/types';
import { default as deno } from '../deno.json' with { type: 'json' };


/**
 * Package meta-data.
 */
export const pkg: t.Pkg = {name: deno.name, version: deno.version };
