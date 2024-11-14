import { pkg as std } from '@sys/std-s';
import { Pkg, type t } from '../common.ts';

const pkg = `
import { Pkg, type t } from 'jsr:${Pkg.toString(std)}';
import { default as deno } from './deno.json' with { type: 'json' };

/**
 * Package meta-data.
 */
export const pkg: t.Pkg = Pkg.fromJson(deno, 'unnamed');
`.slice(1);

const config = (args: { srcDir?: t.StringDir } = {}) => {
  const { srcDir = './docs' } = args;
  return `
import { defineConfig } from 'vitepress';

export default () => {
  return defineConfig({
    title: 'My Sample',
    description: 'See https://vitepress.dev for configuration options.',
    srcDir: '${srcDir}',
  });
};
`.slice(1);
};

/**
 * Export
 */
export const Typescript = {
  pkg,
  config,
} as const;
