import { type t, Fs } from './common.ts';

/**
 * Temporary local ESM surface sniffing.
 *
 * This likely belongs in `@sys/std/m.Esm` once it has earned promotion and can
 * be implemented as a real shared helper rather than staging-local policy.
 */
export async function hasDefaultExport(path: t.StringPath): Promise<boolean> {
  const source = (await Fs.readText(path)).data ?? '';
  return /(^|\n)\s*export\s+default\b/.test(source) || /(^|\n)\s*export\s*\{[^}]*\bdefault\b[^}]*\}/s.test(source);
}
