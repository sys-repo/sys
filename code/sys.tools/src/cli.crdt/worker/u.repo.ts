import { type t, Crdt, D, Fs, Rx } from '../common.ts';

export async function startRepoWorker(dir: t.StringDir, opts: { silent?: boolean } = {}) {
  const { silent = true } = opts;
  const url = new URL('./u.repo.worker.ts', import.meta.url);

  const { repo } = await Crdt.Worker.Client.spawn(url, {
    config: {
      kind: 'fs',
      storage: Fs.join(dir, D.Path.repo),
      network: [{ ws: D.Sync.server }],
      silent,
    },
  });

  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));
  await Rx.firstValueFrom(ready$);
  evt.dispose();

  return repo;
}
