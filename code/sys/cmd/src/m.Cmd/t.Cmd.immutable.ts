import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.CmdPatch;
type E = t.ImmutableEvents<O, P>;

/**
 * An immutable/observable object used to drive the
 * command system.
 */
export type CmdTransport = t.ImmutableRef<O, P, E>;

/**
 * A sparce/generic interface to a Patch used for changes.
 * This allows any kind of patch system to be compatible with
 * the <Cmd> system, it just needs to contain an address [path].
 */
export type CmdPatch = { path: t.ObjectPath | string };

/**
 * Tools for working with the patches are emitted
 *  when the Cmd data structure changes.
 */
export type CmdPatchLib = {
  /* Determine if the patch start with the given path. */
  startsWith(patch: t.CmdPatch, def: t.ObjectPath): boolean;

  /* Extract an object-path from a patch. */
  path(patch: t.CmdPatch): t.ObjectPath;

  /* Determine if the given set includes any "change" patches. */
  includesQueueChange(patches: t.CmdPatch[], paths: t.CmdPaths): boolean;

  /* Determine if the patch represents a change. */
  isQueueChange(patch: t.CmdPatch, paths: t.CmdPaths): boolean;
};
