import { c } from './common.ts';

export function formatHashPrefix(hash?: string): string {
  const PLACEHOLDER = '-tbd-';
  const suffix = String(hash ?? '').trim() || PLACEHOLDER;
  const isPlaceholder = suffix === PLACEHOLDER;
  if (isPlaceholder) {
    return c.dim(`${c.gray('#')}${c.gray(suffix)}`);
  }
  return `${c.gray(c.dim('#'))}${c.green(suffix)}`;
}
