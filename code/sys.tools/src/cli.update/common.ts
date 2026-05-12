import type * as T from './common.t.ts';
import { pkg } from '../pkg.ts';
import { UpdateTool } from './t.namespace.ts';

/** @system: exports */
import { Args, c, Cli } from '@sys/cli';
import { Fs, Path, Pkg } from '@sys/fs';
import { Process } from '@sys/process';
import { Jsr } from '@sys/registry/jsr';
import { Arr } from '@sys/std/arr';
import { Err } from '@sys/std/error';
import { Is } from '@sys/std/is';
import { Json } from '@sys/std/json';
import { Num } from '@sys/std/num';
import { Obj } from '@sys/std/obj';
import { Semver } from '@sys/std/semver';
import { Str } from '@sys/std/str';
import { Time } from '@sys/std/time';

export type * as t from './common.t.ts';
export {
  Args,
  Arr,
  c,
  Cli,
  Err,
  Fs,
  Is,
  Json,
  Jsr,
  Num,
  Obj,
  Path,
  pkg,
  Pkg,
  Process,
  Semver,
  Str,
  Time,
};

/**
 * Common helpers:
 */
type HelpInput =
  | Omit<T.CliFormatHelpInputSections, 'tool'>
  | Omit<T.CliFormatHelpInputShorthand, 'tool'>;

export const Fmt = {
  Tree: Cli.Fmt.Tree,

  invoke(...parts: string[]) {
    return ['deno run -A jsr:@sys/tools', ...parts].join(' ').trim();
  },

  async header(toolname: string, opts: { readonly exitHint?: boolean } = {}) {
    const { exitHint = true } = opts;
    let identity = c.gray(`${c.green(toolname)} v${pkg.version}`);
    if (exitHint) identity += c.gray(c.dim(` (Ctrl-C to exit)`));
    return identity;
  },

  signoff(toolname: string) {
    const self = `${Pkg.toString(pkg)}:${toolname}`;
    return Str.builder()
      .line(c.dim(c.gray(self)))
      .toString();
  },

  helpInput(
    toolname: string,
    input: HelpInput = {},
  ): T.CliFormatHelpInput {
    if ('sections' in input && input.sections) {
      return {
        tool: toolname,
        summary: input.summary ?? `${pkg.name} v${pkg.version}`,
        note: input.note,
        sections: input.sections,
      };
    }

    return {
      tool: toolname,
      summary: input.summary ?? `${pkg.name} v${pkg.version}`,
      note: input.note,
      usage: input.usage,
      options: input.options,
      examples: input.examples,
    };
  },

  async help(toolname: string, input: HelpInput = {}) {
    return Cli.Fmt.Help.build(Fmt.helpInput(toolname, input));
  },

  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  back(opts: { readonly indent?: string; readonly label?: string } = {}) {
    const { indent = '', label = 'back' } = opts;
    return `${indent}${c.cyan('←')} ${c.gray(c.dim(label))}`;
  },
} as const;

/**
 * Constants:
 */
const id = UpdateTool.ID;
const name = UpdateTool.NAME;
export const D = {
  tool: { id, name },
} as const;
