import type { t } from './common.ts';
import { retry } from './u.retry.ts';

export const waitUntil: t.Testing.Lib['until'] = async (pred, options = {}) => {
  const { times = 50, delay = 5 } = options;
  await retry(times, { delay }, async () => {
    const ok = await pred();
    if (!ok) throw new Error('not yet');
  });
};
