import { create } from './Cmd.impl.ts';
import { Events, Is, Patch, Path, Queue, toPaths, toTransport, toIssuer } from './u.ts';
import type { t } from './common.ts';

export type CmdLib = {
  readonly Is: t.CmdIsLib;
};

/**
 * Command event structure on an observable/syncing CRDT.
 * Primitive for building up an actor model ("message passing computer").
 */
export const Cmd = {
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
  autopurge: Queue.autopurge,
  toTransport,
  toPaths,
  toIssuer,
} as const;
