import { type t, Cmd } from './common.ts';

/**
 * Worker-level command RPC.
 */
export const CrdtWorkerCmd: t.CrdtWorkerCmdLib = {
  make() {
    return Cmd.make<t.CrdtWorkerCmdName, t.CrdtWorkerCmdPayload, t.CrdtWorkerCmdResult>();
  },
};
