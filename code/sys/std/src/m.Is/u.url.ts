import { type t, isRecord } from '../common.ts';

/**
 * Determine if the given value is structurally URL-like.
 *
 * Matches:
 *  - `URL` instances
 *  - any `{ href: string }`
 *  - any `{ toURL(): URL }`
 */
export const urlLike: t.StdIsLib['urlLike'] = (input): input is t.UrlLike => {
  if (input instanceof URL) return true;

  if (isRecord(input)) {
    if (typeof (input as any).href === 'string') return true;
    if (typeof (input as any).toURL === 'function') return true;
  }

  return false;
};

/**
 * True if the input is a valid http/https URL string.
 *
 * Only absolute http/https URLs are treated as URL strings;
 * everything else (relative, malformed, non-string) returns false.
 */
export const urlString: t.StdIsLib['urlString'] = (input): input is t.StringUrl => {
  if (typeof input !== 'string') return false;
  if (!/^https?:\/\//i.test(input)) return false;
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
};
