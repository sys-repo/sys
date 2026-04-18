export { Args, Arr, Err, Is, Json, Path, R, Str, Time } from '@sys/std';
export { Semver } from '@sys/std/semver/server';

export { Cli, c } from '@sys/cli';
export { DenoDeps, DenoFile } from '@sys/driver-deno/runtime';
export { Fs } from '@sys/fs';
export { Process } from '@sys/process';
export { Update } from '@sys/text/update';
export { TmplEngine } from '@sys/tmpl-engine';

export * as t from './t.ts';

/**
 * Defaults:
 */
export const D = {
  ci: {
    jsrScopes: ['@sys', '@tdb'],
    on: {
      push: {
        branches: ['main', 'phil-work'],
        paths_ignore: ['.github/workflows/jsr.yaml'],
      },
    },
  },
} as const;
