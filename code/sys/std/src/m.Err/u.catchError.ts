import type { t } from './common.ts';
import { std } from './u.std.ts';

type F = t.ErrLib['catch'];

export const catchError: F = async <T>(promise: Promise<T>) => {
  try {
    return { ok: true, data: await promise, error: undefined };
  } catch (cause) {
    return { ok: false, error: std(cause) };
  }
};
