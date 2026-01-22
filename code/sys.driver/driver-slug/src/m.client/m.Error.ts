import type { t } from './common.ts';

export const SlugError: t.SlugClientErrorLib = {
  unwrap<T>(res: t.SlugClientResult<T>): T {
    if (res.ok) return res.value;
    return SlugError.throw(res.error);
  },

  throw(err): never {
    throw new Error(err.message);
  },
};
