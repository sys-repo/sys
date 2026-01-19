import type { t } from './common.ts';

export const SlugError: t.SlugClientErrorLib = {
  unwrap<T>(res: t.Result<T>): T {
    if (res.ok) return res.value;
    return SlugError.throw(res.error);
  },

  throw(err): never {
    if (err.kind === 'http') {
      throw new Error(`Manifest fetch failed. ${err.status} ${err.statusText} @ ${err.url}`);
    }
    throw new Error(err.message);
  },
};
