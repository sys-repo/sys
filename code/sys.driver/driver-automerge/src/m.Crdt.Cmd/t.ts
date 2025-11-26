import type { t } from './common.ts';

export type * from './t.lib.ts';

type Name = t.CrdtCmdName;
type Payload = t.CrdtCmdPayload;
type Result = t.CrdtCmdResult;

/**
 * Factory for the typed CRDT command set.
 * Produced by `Crdt.Cmd.make()`, providing `.client(port)` and `.host(port, handlers)`.
 */
export type CrdtCmdFactory = t.CmdInstance<Name, Payload, Result>;

/**
 * Command client: `.send(name, payload)` → Promise<result>.
 */
export type CrdtCmdClient = t.CmdClient<Name, Payload, Result>;
