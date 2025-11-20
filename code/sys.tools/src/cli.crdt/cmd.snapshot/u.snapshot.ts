import { type t, c, Cli, Rx } from '../common.ts';
import { startRepoWorker } from '../worker/mod.ts';
import { process } from './u.process.ts';

export async function snapshot(dir: t.StringDir, id: t.StringId) {
  const spinner = Cli.spinner();
  const repo = await startRepoWorker(dir);

  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));
  await Rx.firstValueFrom(ready$);
  spinner.stop();

  const root = '-backup';
  const res = await process({ repo, id, root });

}
