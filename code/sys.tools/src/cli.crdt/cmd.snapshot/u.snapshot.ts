import { type t, c, Cli, Rx } from '../common.ts';
import { startRepoWorker } from '../worker/mod.ts';
import { process, type ProcessEvent } from './u.process.ts';

export async function snapshot(dir: t.StringDir, id: t.StringId) {
  /**
   * Prepare CRDT respository on background worker.
   */
  const spinner = Cli.spinner();
  const repo = await startRepoWorker(dir);
  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));
  await Rx.firstValueFrom(ready$);
  spinner.stop();

  /**
   * Process snapshot/backup request.
   */
  const progress: ProcessEvent[] = [];

  spinner.start(c.gray('processing...'));
  const res = await process({
    repo,
    id,
    base: '-backup',
    onProgress(e) {
      console.log('progress', e);
      progress.push(e);
    },
  });

  spinner.stop();

}
