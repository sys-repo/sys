import { pkg } from '../pkg.ts';
import { UpgradeTool } from './t.namespace.ts';

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
import { WorkspaceResolve } from '@sys/workspace/resolve';

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
  Pkg,
  pkg,
  Process,
  Semver,
  Str,
  Time,
  WorkspaceResolve,
};

/**
 * Constants:
 */
const id = UpgradeTool.ID;
const name = UpgradeTool.NAME;
export const D = {
  tool: { id, name },
} as const;
