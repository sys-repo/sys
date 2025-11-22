import { type t, Cmd } from './common.ts';

/**
 * Worker-level command RPC.
 */
export const CrdtWorkerCmd: t.CrdtWorkerCmdLib = {
  make() {
    type Name = t.CrdtWorkerCmdName;
    type Payload = t.CrdtWorkerCmdPayload;
    type Result = t.CrdtWorkerCmdResult;

    return Cmd.make<Name, Payload, Result>();
  },
};
