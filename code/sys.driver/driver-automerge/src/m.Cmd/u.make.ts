import { type t, Cmd } from './common.ts';

export function make(): t.CrdtCmdFactory {
  return Cmd.make<t.CrdtCmdName, t.CrdtCmdPayload, t.CrdtCmdResult>();
}
