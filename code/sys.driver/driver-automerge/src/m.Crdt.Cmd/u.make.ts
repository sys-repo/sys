import { type t, Cmd } from './common.ts';

export function make(): t.CrdtWorkerCmdInstance {
  return Cmd.make<t.CrdtWorkerCmdName, t.CrdtWorkerCmdPayload, t.CrdtWorkerCmdResult>();
}
