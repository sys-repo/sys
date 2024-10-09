import { create } from './Cmd.impl.ts';
import { DEFAULTS } from './common.ts';
import { Events, Is, Patch, Path, Queue, toPaths, toTransport, toIssuer } from './u.ts';

/**
 * Command event structure on an observable/syncing CRDT.
 * Primitive for building up an actor model ("message passing computer").
 */
export const Cmd = {
  DEFAULTS,
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
