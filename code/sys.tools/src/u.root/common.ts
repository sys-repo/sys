export type * as t from './common.t.ts';

export { pkg } from '../pkg.ts';
export { Args, c, Cli } from '@sys/cli';
export { Path } from '@sys/fs';
export { Process } from '@sys/process';
export { Is } from '@sys/std/is';
export { Str } from '@sys/std/str';

import { c } from '@sys/cli';
import { TOOL_IDS } from './common.tools.ts';

export const Fmt = {
  /** Deterministic runnable command for this published package. */
  invoke(...parts: string[]) {
    return ['deno run -A jsr:@sys/tools', ...parts].join(' ').trim();
  },

  /** Root-menu back affordance. */
  back(opts: { readonly indent?: string; readonly label?: string } = {}) {
    const { indent = '', label = 'back' } = opts;
    return `${indent}${c.cyan('←')} ${c.gray(c.dim(label))}`;
  },
} as const;

export const D = {
  TOOLS: TOOL_IDS,
} as const;
