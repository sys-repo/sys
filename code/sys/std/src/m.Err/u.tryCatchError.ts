import type { t } from './common.ts';
import { std } from './u.std.ts';

export const tryCatch: t.ErrLib['tryCatch'] = async <T>(promise: Promise<T>) => {
  try {
    const data = await promise;
    return { ok: true, data, error: undefined };
  } catch (cause) {
    return { ok: false, error: std(cause) };
  }
};
