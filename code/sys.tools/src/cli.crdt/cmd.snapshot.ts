import { type t } from './common.ts';
import { startRepoWorker } from './worker/mod.ts';

export async function snapshot(dir: t.StringDir, id: t.StringId) {

  const repo = await startRepoWorker(dir);


  });
}
