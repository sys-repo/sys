import { type t, Is } from './common.ts';
import { attachRepo } from './u.host.attach.repo.ts';

type Methods = t.CrdtCmdHandlers;
type Args = {
  port: MessagePort;
  repo?: t.CrdtRepo;
  factory?: t.CrdtRepoFactory;
};

export function makeAttachHandler(
  args: Args,
  onRepoCreated: (created: t.CrdtRepo) => void,
): Methods['attach'] {
  return async ({ config }) => {
    const ok: t.CrdtCmdResult['attach'] = { ok: true };

    // Repo already exists.
    if (args.repo) {
      attachRepo(args.port, args.repo);
      return ok;
    }

    // Lazily create repo via factory on first attach.
    if (args.factory) {
      const repo = await args.factory({ config });
      onRepoCreated(repo);

      // If this is an filesystem-based worker with a publish config,
      // start the WebSocket command server for this repo.
      if (config?.kind === 'fs' && config.publish) {
        if (Is.browser()) throw new Error(`Cannot load an "fs" configuration in the browser`);
        const { publishCommands } = await import('./u.host.publishCommands.ts');
        const { port, hostname } = config.publish;
        publishCommands({ repo, port, hostname });
      }

      attachRepo(args.port, repo);
      return ok;
    }

    // No repo or factory available.
    return ok;
  };
}
