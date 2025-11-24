import { type t, Cli } from './common.ts';
import { startRepoWorker } from './worker/mod.ts';

export async function tmp(dir: t.StringDir, docid: t.Crdt.Id) {
  const spinner = Cli.spinner();
  const repo = await startRepoWorker(dir);

  console.log('dir', dir);
  console.log('id', docid);

  const { doc } = await repo.get(docid);

  spinner.stop();

  console.log('doc', doc?.current);
}
