import { type t, isRecord } from '../common.ts';

/**
 * Determine if the given value is structurally URL-like.
 *
 * Matches:
 *  - `URL` instances
 *  - any `{ href: string }`
 *  - any `{ toURL(): URL }`
 */
export const urlLike: t.StdIsLib['urlLike'] = (input?: unknown): input is t.UrlLike => {
  if (input instanceof URL) return true;

  if (isRecord(input)) {
    if (typeof (input as any).href === 'string') return true;
    if (typeof (input as any).toURL === 'function') return true;
  }

  return false;
};
