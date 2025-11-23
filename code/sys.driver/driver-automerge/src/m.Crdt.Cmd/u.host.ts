import { type t } from './common.ts';
import { make } from './u.make.ts';
import { makeStatsHandler, makeSaveHandler } from './commands/mod.ts';

/**
 * Attach a CRDT command host to a MessagePort for a given repo getter.
 *
 * Used for local repos wired through a synthetic MessageChannel.
 * (Worker hosts still use their own attach handler/factory logic.)
 */
export const attachCmdHostToPort = (
  port: MessagePort,
  getRepo: () => t.Crdt.Repo | undefined,
): t.CmdHost => {
  const cmd = make();

  const handlers: t.CrdtCmdHandlers = {
    attach: () => ({ ok: true }), // no handshake needed locally
    stats: makeStatsHandler(getRepo),
    'fs:save': makeSaveHandler(getRepo),
  };

  return cmd.host(port, handlers);
};
