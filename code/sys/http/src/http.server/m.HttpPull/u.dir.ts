import { type t, Await, HttpClient } from './common.ts';
import { pullOne } from './u.pullOne.ts';

export const toDir: t.HttpPullLib['toDir'] = async (urls, dir, opts = {}) => {
  const { map, retry } = opts;
  const client = opts.client ?? HttpClient.fetcher();
  const concurrency = Math.max(1, opts?.concurrency ?? 8);
  const limit = Await.semaphore(concurrency);

  const tasks = urls.map((url) => limit(() => pullOne(url, dir, client, { map, retry })));
  const ops = await Promise.all(tasks);
  const ok = ops.every((op) => op.ok);
  return { ok, ops };
};
