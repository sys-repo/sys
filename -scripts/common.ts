export { Args } from '@sys/std/args';
export { Arr } from '@sys/std/arr';
export { Err } from '@sys/std/error';
export { Is } from '@sys/std/is';
export { Json } from '@sys/std/json';
export { Num } from '@sys/std/num';
export { Obj } from '@sys/std/obj';
export { Path } from '@sys/std/path';
export { R } from '@sys/std/r';
export { Semver } from '@sys/std/semver/server';
export { Str } from '@sys/std/str';
export { Time } from '@sys/std/time';
export { JsrUrl } from '@sys/std/url';

export { c, Cli } from '@sys/cli';
export { DenoDeps, DenoFile } from '@sys/driver-deno/runtime';
export { Git } from '@sys/driver-process/git';
export { Fs } from '@sys/fs';
export { Process } from '@sys/process';
export { TextUpdate } from '@sys/text/update';
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
