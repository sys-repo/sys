import { Is, Num, type t } from './common.ts';

const PART_PREFIX = /^(sha256-[0-9a-f]{64})(?::size=(0|[1-9][0-9]*))?/;

export const Part: t.Pkg.Dist.Part.Lib = {
  parse,
  hash: (value) => parse(value)?.hash,
  size: (value) => parse(value)?.size,
};

/**
 * Helpers:
 *
 * Accepted `dist.hash.parts[path]` shapes:
 * - "sha256-<64 lowercase hex>:size=<canonical bytes>"
 * - "sha256-<64 lowercase hex>" (no size)
 */
function parse(value: unknown): t.PkgDistPartInfo | undefined {
  if (!Is.str(value)) return undefined;

  const match = PART_PREFIX.exec(value);
  if (!match || match[0] !== value) return undefined; // Exact: `$` may stop before a final newline.

  const hash = match[1] as t.StringHash;
  const sizeRaw = match[2];
  if (sizeRaw === undefined) return { hash };

  const size = Number(sizeRaw);
  if (!Num.Is.safeInt(size) || size < 0) return undefined;
  return { hash, size };
}
