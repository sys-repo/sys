import { type t, Crdt, D, Fs, Rx } from '../common.ts';

export async function startRepoWorker(
  dir: t.StringDir,
  opts: { silent?: boolean; ws?: string } = {},
) {
  const { silent = true } = opts;
  const url = new URL('./u.repo.worker.ts', import.meta.url);

  const config: t.Crdt.Worker.ConfigFs = {
    kind: 'fs',
    storage: Fs.join(dir, D.Path.repo),
    network: [{ ws: opts.ws ?? D.Sync.server }],
    silent,
  };

  const { repo } = await Crdt.Worker.Client.spawn(url, { config });

  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));
  await Rx.firstValueFrom(ready$);
  evt.dispose();

  return repo;
}
