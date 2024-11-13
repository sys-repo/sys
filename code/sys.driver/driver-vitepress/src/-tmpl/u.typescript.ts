import { pkg as std } from '@sys/std-s';
import { Pkg } from '../common.ts';
import { config } from './u.typescript.config.ts';

export const pkg = `
import { Pkg, type t } from 'jsr:${Pkg.toString(std)}';
import { default as deno } from './deno.json' with { type: 'json' };

/**
 * Package meta-data.
 */
export const pkg: t.Pkg = Pkg.fromJson(deno, 'my-name');
`.slice(1);

/**
 * Export
 */
export const Typescript = {
  pkg,
  config,
} as const;
