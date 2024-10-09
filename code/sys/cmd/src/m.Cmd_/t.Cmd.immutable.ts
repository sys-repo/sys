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
