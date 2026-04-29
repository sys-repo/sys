import { Err, type t } from './common.ts';

export function done(data: t.PullToolBundleResult): t.PullToolRemoteBundleResult {
  return { ok: true, data };
}

export function fail(error: string): t.PullToolRemoteBundleResult {
  return { ok: false, error };
}

export function errorMessage(error: unknown): string {
  if (Err.Is.error(error)) return String(error.message ?? '').trim() || 'Bundle pull failed';
  return String(error ?? '').trim() || 'Bundle pull failed';
}
