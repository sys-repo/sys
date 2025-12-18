import { type t } from './common.ts';

/**
 * Accepted `dist.hash.parts[path]` shapes:
 * - "sha256-<hex>:size=<bytes>"
 * - "sha256-<hex>" (no size)
 */
function parseString(input: string): t.PkgDistPartInfo | undefined {
  const s = input.trim();

  // 1) Full form (preferred): sha256-<hex>:size=<bytes>
  let m = s.match(/^(sha256-[0-9a-f]{16,})(?::size=(\d+)\b)?$/i);
  if (!m) return undefined;

  const hash = m[1] as t.StringHash;
  const sizeRaw = m[2];

  if (!sizeRaw) return { hash };

  const n = Number(sizeRaw);
  if (!Number.isFinite(n) || n < 0) return { hash };

  // Keep it an integer if possible.
  const size = Math.floor(n);
  return { hash, size };
}

export const Part: t.PkgDistPartLib = {
  parse(value: unknown): t.PkgDistPartInfo | undefined {
    if (typeof value !== 'string') return undefined;
    return parseString(value);
  },

  hash(value: unknown): t.StringHash | undefined {
    const info = this.parse(value);
    return info?.hash;
  },

  size(value: unknown): number | undefined {
    const info = this.parse(value);
    return info?.size;
  },
};
