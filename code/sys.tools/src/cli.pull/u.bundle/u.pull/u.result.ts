import { Err, type t } from './common.ts';

export function done(data: t.PullToolBundleResult): t.PullToolRemoteBundleResult {
  return { ok: true, data };
}

export function fail(error: string): t.PullToolRemoteBundleResult {
  return { ok: false, error };
}

export function errorMessage(error: unknown): string {
  const message = Err.Is.error(error)
    ? String(error.message ?? '').trim()
    : String(error ?? '').trim();
  return redactSecrets(message) || 'Bundle pull failed';
}

function redactSecrets(input: string): string {
  return input
    .replace(/\bAuthorization\s*:\s*Bearer\s+[^\s,;]+/gi, 'Authorization: Bearer [redacted]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [redacted]')
    .replace(
      /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
      '[redacted-github-token]',
    )
    .replace(/([?&](?:access_token|token)=)[^&\s]+/gi, '$1[redacted]');
}
