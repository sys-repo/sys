import type { t } from './common.ts';
import { create } from './m.Cmd.impl.ts';
import { Events, Is, Patch, Path, Queue, toIssuer, toPaths, toTransport } from './u.ts';

export const Cmd: t.CmdLib = {
  Is,
  Path,
  Patch,
  Events,
  Queue,

  /**
   * Factory.
   */
  create,

  /**
   * Helpers.
   */
  toTransport,
  toPaths,
  toIssuer,
} as const;
