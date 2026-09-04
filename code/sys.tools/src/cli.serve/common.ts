import type * as t from './common.t.ts';
import { pkg } from '../pkg.ts';
import { ServeTool } from './t.namespace.ts';

/** @system: exports */
import { Args, c, Cli } from '@sys/cli';
import { Hash } from '@sys/crypto/hash';
import { Fs, Path, Pkg } from '@sys/fs';
import { Http, serveFileWithEtag } from '@sys/http/server';
import { Open, Process } from '@sys/process';
import { Schema } from '@sys/schema';
import { Arr } from '@sys/std/arr';
import { Err } from '@sys/std/error';
import { Is } from '@sys/std/is';
import { Json } from '@sys/std/json';
import { MediaType } from '@sys/std/media-type';
import { Num } from '@sys/std/num';
import { Obj } from '@sys/std/obj';
import { Str } from '@sys/std/str';
import { Time } from '@sys/std/time';
import { Yaml } from '@sys/yaml';

export type * as t from './common.t.ts';
export {
  Args,
  Arr,
  c,
  Cli,
  Err,
  Fs,
  Hash,
  Http,
  Is,
  Json,
  MediaType,
  Num,
  Obj,
  Open,
  Path,
  Pkg,
  pkg,
  Process,
  Schema,
  serveFileWithEtag,
  Str,
  Time,
  Yaml,
};

/**
 * Common helpers:
 */
type HelpInput =
  | Omit<t.Cli.Fmt.Help.InputSections, 'tool'>
  | Omit<t.Cli.Fmt.Help.InputShorthand, 'tool'>;

export const done = (exit: number | boolean = false): t.RunReturn => ({ exit });

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
  ): t.Cli.Fmt.Help.Input {
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

  hashSuffix(hash: string, suffix = 5) {
    const tail = String(hash).slice(-Math.max(0, suffix));
    return `${c.dim(c.gray('#'))}${c.green(tail)}`;
  },
} as const;

/**
 * Constants:
 */
const id = ServeTool.ID;
const name = ServeTool.NAME;
export const D = {
  tool: { id, name },
  port: 4040,
  Path: {},
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.ServeTool.Command;
export const opt = (name: string, value: C): t.ServeTool.MenuOption => ({ name, value });
