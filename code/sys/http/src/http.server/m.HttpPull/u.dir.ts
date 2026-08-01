import { Await, HttpClient, type t } from './common.ts';
import { pullOne } from './u.pullOne.ts';

export const toDir: t.HttpPull.Lib['toDir'] = async (urls, dir, options) => {
  const { map, retry } = options;
  const ownsClient = !options.client;
  const client = options.client ?? HttpClient.fetcher({
    policy: options.policy,
    until: options.until,
  });
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const limit = Await.semaphore(concurrency);

  try {
    const tasks = urls.map((url) => limit(() => pullOne(url, dir, client, { map, retry })));
    const ops = await Promise.all(tasks);
    const ok = ops.every((op) => op.ok);
    return { ok, ops } as t.HttpPull.ToDir.Result;
  } finally {
    if (ownsClient) client.dispose();
  }
};
