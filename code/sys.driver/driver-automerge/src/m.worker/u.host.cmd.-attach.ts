import { type t } from './common.ts';
import { attachRepo } from './u.host.attach.repo.ts';

type Methods = t.CrdtWorkerCmdHandlers;
type Args = { port: MessagePort; repo?: t.CrdtRepo; factory?: t.CrdtRepoFactory };

export function makeAttach(
  args: Args,
  onRepoCreated: (created: t.CrdtRepo) => void,
): Methods['attach'] {
  return async ({ config }) => {
    // Normalise the canonical "ok" response once.
    const ok: t.CrdtWorkerCmdResult['attach'] = { ok: true };

    // Repo already exists.
    if (args.repo) {
      attachRepo(args.port, args.repo);
      return ok;
    }

    // Lazily create repo via factory on first attach.
    if (args.factory) {
      const created = await args.factory({ config });
      onRepoCreated(created);
      attachRepo(args.port, created);
      return ok;
    }

    // No repo or factory available: nothing to attach, but keep protocol simple.
    return ok;
  };
}
