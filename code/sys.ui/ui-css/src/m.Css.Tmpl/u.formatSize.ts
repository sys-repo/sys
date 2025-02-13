import type { t } from './common.ts';

export function formatSize(key: string, input: unknown, target: t.CssProps) {
  type V = string | number | undefined;
  const format = (input: any): V => {
    if (!(typeof input === 'number' || typeof input === 'string')) return;
    if (typeof input === 'string' && !input.trim()) return;
    return input;
  };
  if (Array.isArray(input)) {
    const width = format(input[0]);
    const height = format(input[1]);
    if (width !== undefined && height !== undefined) {
      const styles = { width, height };
      mergeAndReplace(key, styles, target);
    }
  } else {
    const value = format(input);
    if (value !== undefined) {
      const styles = { width: value, height: value };
      mergeAndReplace(key, styles, target);
    }
  }
}

function mergeAndReplace(key: string, value: unknown, target: t.CssProps) {
  Object.assign(target, value);
  delete target[key as keyof t.CssProps];
  return target;
}
