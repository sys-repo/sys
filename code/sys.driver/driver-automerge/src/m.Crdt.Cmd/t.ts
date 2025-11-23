import type { t } from './common.ts';

export type * from './t.lib.ts';
export type * from './t.commands.ts';

type Name = t.CrdtCmdName;
type Payload = t.CrdtCmdPayload;
type Result = t.CrdtCmdResult;

/**
 * Fully-typed command set for CRDT commands.
 *
 * Instances are produced by `Crdt.Cmd.make()` and expose:
 *   - `.client(port)` → command client bound to a MessagePort
 *   - `.host(port, handlers)` → handler-side command host
 */
export type CrdtCmdInstance = t.CmdInstance<Name, Payload, Result>;

/**
 * Command client: `.send(name, payload)` → Promise<result>.
 */
export type CrdtCmdClient = t.CmdClient<Name, Payload, Result>;
