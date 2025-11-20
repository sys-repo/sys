import { type t, Rx, c, Cli, Schedule } from './common.ts';
import { startRepoWorker } from './worker/mod.ts';

export async function snapshot(dir: t.StringDir, id: t.StringId) {
  const spinner = Cli.spinner();
  const repo = await startRepoWorker(dir);

  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));

  await Rx.firstValueFrom(ready$);
  spinner.stop();

  console.info();
  console.info();
  console.info('TODO - snapshot 🐷 ');

}
