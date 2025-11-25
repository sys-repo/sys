import { type t, Cli, Str, Rx, slug, Obj } from '../common.ts';
import { startRepoOnWorker } from '../worker/mod.ts';

const Tree = Cli.Fmt.Tree;

export async function findTasks(dir: t.StringDir, id: t.StringId) {

  /**
   * Prepare CRDT repository on background worker.
   */
  const spinner = Cli.spinner();
  const repo = await startRepoOnWorker(dir);
  spinner.stop();

}
