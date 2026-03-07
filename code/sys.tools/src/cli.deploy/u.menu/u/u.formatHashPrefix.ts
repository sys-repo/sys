import { c, Fmt } from './common.ts';

export function formatHashPrefix(hash?: string): string {
  const suffix = String(hash ?? '').trim();
  const isPlaceholder = !suffix;
  if (isPlaceholder) return `${c.gray(c.dim('#'))}${' '.repeat(5)}`;
  return Fmt.hashSuffix(suffix, 5);
}
