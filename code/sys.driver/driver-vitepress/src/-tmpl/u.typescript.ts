import { pkg as std } from '@sys/std-s';
import { Pkg } from '../common.ts';

export const pkg = `
import { Pkg, type t } from 'jsr:${Pkg.toString(std)}';
import { default as deno } from './deno.json' with { type: 'json' };

/**
 * Package meta-data.
 */
export const pkg: t.Pkg = Pkg.fromJson(deno, 'unnamed');
`.slice(1);

export const config = `
import { defineConfig } from 'vitepress';

export default () => {
  return defineConfig({
    title: 'My Sample',
    description: 'See https://vitepress.dev for configuration options.',
    srcDir: './docs',
  });
};
`.slice(1);

/**
 * Export
 */
export const Typescript = {
  pkg,
  config,
} as const;
