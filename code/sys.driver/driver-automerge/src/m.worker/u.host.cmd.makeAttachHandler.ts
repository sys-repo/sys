import type { t } from './common.ts';
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
      const created = await args.factory({ config });
      onRepoCreated(created);
      const instance = created;
      attachRepo(args.port, instance);
      return ok;
    }

    // No repo or factory available.
    return ok;
  };
}
