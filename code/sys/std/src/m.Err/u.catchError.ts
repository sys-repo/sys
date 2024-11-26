import type { t } from './common.ts';
import { std } from './u.std.ts';

type F = t.ErrLib['catch'];

export const catchError: F = async <T>(promise: Promise<T>) => {
  try {
    const data = await promise;
    return { ok: true, data, error: undefined };
  } catch (cause) {
    return { ok: false, error: std(cause) };
  }
};
