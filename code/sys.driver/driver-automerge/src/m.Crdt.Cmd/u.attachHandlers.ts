import { makeSaveHandler, makeStatsHandler } from '../m.commands/mod.ts';
import type { t } from './common.ts';
import { make } from './u.make.ts';

/**
 * Attach a CRDT command host to a command endpoint.
 *
 * Typically used for local repos wired through a synthetic MessageChannel.
 * (Worker hosts still use their own attach handler/factory logic.)
 */
export const attachHandlers = (args: {
  endpoint: t.CmdEndpoint;
  getRepo: () => t.Crdt.Repo | undefined;
  handlers?: Partial<t.CrdtCmdHandlers>;
}): t.CmdHost => {
  const { endpoint, getRepo } = args;
  const cmd = make();

  const handlers: t.CrdtCmdHandlers = {
    attach: () => ({ ok: true }), // ← no handshake needed locally
    stats: makeStatsHandler(getRepo),
    'fs:save': makeSaveHandler(getRepo),
    ...args.handlers,
  };

  return cmd.host(endpoint, handlers);
};
