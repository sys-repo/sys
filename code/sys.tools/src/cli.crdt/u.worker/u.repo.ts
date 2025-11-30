import { type t, Arr, Crdt, D, Fs, Is, Rx } from '../common.ts';

export async function startRepoOnWorker(
  cwd: t.StringDir,
  opts: { silent?: boolean; websockets?: string[]; port?: number } = {},
) {
  const { silent = true, port } = opts;
  const url = new URL('./u.repo.worker.ts', import.meta.url);
  const network = Arr.uniq([
    ...D.Config.doc.repo.daemon.sync.websockets,
    ...(opts.websockets ?? []),
  ]).map((ws) => ({ ws }));

  /**
   * Construct the repo.
   */
  const config: t.Crdt.Worker.ConfigFs = {
    kind: 'fs',
    storage: Fs.join(cwd, D.Path.Repo.daemon),
    network,
    publish: Is.num(port) ? { port } : undefined,
    silent,
  };

  const { repo } = await Crdt.Worker.Client.spawn(url, { config });

  /**
   * Wait for ready state.
   */
  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));
  await Rx.firstValueFrom(ready$);
  evt.dispose();

  // Finish up.
  return repo;
}
