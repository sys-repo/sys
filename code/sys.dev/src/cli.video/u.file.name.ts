import { type t, Fs, Path } from './common.ts';

/**
 * Compute the next output path using **chained extension lineage**.
 *
 * Rules:
 * - Always include a two-digit counter segment `.NN` (starts at 01).
 * - Preserve full provenance by chaining extensions after the counter.
 *   Examples:
 *     hello.webm                   → hello.webm.01.webm.mp4
 *     hello.webm.01.webm.mp4       → hello.webm.02.webm.mp4.webm
 *     foreign.mp4                  → foreign.mp4.01.mp4.webm
 *
 * - Never overwrite: probe the filesystem and pick the first free counter.
 */
export const nextOutPath: t.VideoToolsLib['nextOutPath'] = async (args): Promise<t.StringPath> => {
  const { src, toExt } = args;
  const dir = Path.dirname(src);
  const name = Path.basename(src);
  const srcExt = Path.extname(name).toLowerCase(); // e.g. ".webm" | ".mp4"
  const to = toExt.toLowerCase().replace(/^\./, ''); // e.g. "mp4" | "webm"

  const parsed = parseName(name, srcExt);

  // next counter
  const start = parsed.step + 1;

  // lineage chain: existing chain + next target ext
  const chain = parsed.chain.length > 0 ? [...parsed.chain, to] : [stripDot(srcExt), to];

  // suffix we append after ".NN"
  const suffix = `.${chain.join('.')}`; // e.g. ".webm.mp4" or ".mp4.webm"

  // find a free file: <base>.<NN><suffix>
  return (await findFree(dir as t.StringDir, `${parsed.base}.`, suffix, start)) as t.StringPath;
};

/**
 * Helpers:
 */

/**
 * Parse a name into:
 * - base:  the “root” file name before the first numeric counter
 * - step:  the current step number (or 0 if none)
 * - chain: array of extension tokens after the counter (if any)
 *
 * Patterns handled:
 * - "<base>" (no counter) → step=0, chain=[stripDot(srcExt)]
 * - "<base>.<NN>.<chain...>"
 */
function parseName(name: string, srcExt: string) {
  // Look for ".NN." where NN is two digits.
  const m = name.match(/\.(\d{2})\./);
  if (!m || m.index === undefined) {
    // No counter → base is full name, no chain captured yet
    return {
      base: name,
      step: 0,
      chain: [] as string[], // will be filled by caller with srcExt
    };
  }

  const idx = m.index;
  const step = clamp2(parseInt(m[1], 10) || 0);
  const base = name.slice(0, idx); // everything before ".NN."
  const after = name.slice(idx + m[0].length); // everything after ".NN."

  // "after" is the dotted chain (e.g. "webm.mp4"). Normalize empties.
  const chain = after
    .split('.')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return { base, step, chain };
}

async function findFree(
  dir: t.StringDir,
  prefix: string, // e.g. "hello.webm."
  suffix: string, // e.g. ".webm.mp4"
  start: number, // starting counter (1-based)
): Promise<string> {
  let n = start < 1 ? 1 : start;
  while (n < 10_000) {
    const tag = pad2(n);
    const candidate = Path.join(dir, `${prefix}${tag}${suffix}`);
    if (!(await Fs.exists(candidate))) return candidate;
    n++;
  }
  // Extremely unlikely; deterministic fallback.
  return Path.join(dir, `${prefix}${Date.now()}${suffix}`);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function clamp2(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 99) return 99;
  return n;
}

function stripDot(ext: string): string {
  return ext.startsWith('.') ? ext.slice(1) : ext;
}
