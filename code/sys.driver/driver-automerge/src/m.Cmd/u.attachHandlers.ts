import {
  makeDocCreateHandler,
  makeDocReadHandler,
  makeDocSaveHandler,
  makeDocStatsHandler,
  makeDocWriteHandler,
} from '../m.Cmd.commands/mod.ts';
import { type t, Is } from './common.ts';
import { make } from './u.make.ts';

/**
 * Attach a CRDT command host to a command endpoint.
 *
 * Typically used for local repos wired through a synthetic MessageChannel.
 * (Worker hosts still use their own attach handler/factory logic.)
 */
export const attachHandlers = (args: {
  endpoint: t.CmdEndpoint;
  repo: t.CrdtRepoInput;
  handlers?: Partial<t.CrdtCmdHandlers>;
}): t.CmdHost => {
  const { endpoint } = args;
  const cmd = make();
  const getRepo = () => (Is.func(args.repo) ? args.repo() : args.repo);

  const handlers: t.CrdtCmdHandlers = {
    attach: () => ({ ok: true }), // ← NB: no handshake needed locally
    'doc:create': makeDocCreateHandler(getRepo),
    'doc:read': makeDocReadHandler(getRepo),
    'doc:write': makeDocWriteHandler(getRepo),
    'doc:stats': makeDocStatsHandler(getRepo),
    'doc:save': makeDocSaveHandler(getRepo),
    ...args.handlers,
  };

  return cmd.host(endpoint, handlers);
};
