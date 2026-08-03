import type { t } from './common.ts';

/**
 * Parsed information from a `dist.hash.parts[path]` string.
 */
export type PkgDistPartInfo = {
  /** Canonical hash string (eg. "sha256-..."). */
  readonly hash: t.StringHash;
  /** Optional size (bytes). */
  readonly size?: t.NumberBytes;
};
