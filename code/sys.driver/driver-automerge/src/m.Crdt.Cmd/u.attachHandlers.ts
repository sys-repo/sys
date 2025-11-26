import type { t } from './common.ts';
import { make } from './u.make.ts';
import { makeStatsHandler, makeSaveHandler } from '../m.commands/mod.ts';

/**
 * Attach a CRDT command host to a command endpoint.
 *
 * Typically used for local repos wired through a synthetic MessageChannel.
 * (Worker hosts still use their own attach handler/factory logic.)
 */
export const attachHandlers = (
  endpoint: t.CmdEndpoint,
  getRepo: () => t.Crdt.Repo | undefined,
): t.CmdHost => {
  const cmd = make();

  const handlers: t.CrdtCmdHandlers = {
    attach: () => ({ ok: true }), // ← no handshake needed locally
    stats: makeStatsHandler(getRepo),
    'fs:save': makeSaveHandler(getRepo),
  };

  return cmd.host(endpoint, handlers);
};
