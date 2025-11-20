import { type t, Crdt, D } from '../common.ts';

export async function startRepoWorker(dir: t.StringDir, opts: { silent?: boolean } = {}) {
  const { silent = true } = opts;
  const url = new URL('./u.repo.worker.ts', import.meta.url);

  const { repo } = await Crdt.Worker.Client.spawn(url, {
    config: {
      kind: 'fs',
      storage: dir,
      network: [{ ws: D.Sync.server }],
      silent,
    },
  });

  return repo;
}
