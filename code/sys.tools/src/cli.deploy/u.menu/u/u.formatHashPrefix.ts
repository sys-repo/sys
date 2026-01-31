import { c } from './common.ts';

export function formatHashPrefix(hash?: string): string {
  const suffix = String(hash ?? '').trim();
  const isPlaceholder = !suffix;
  if (isPlaceholder) return `${c.gray(c.dim('#'))}${' '.repeat(5)}`;
  return `${c.gray(c.dim('#'))}${c.green(suffix)}`;
}
