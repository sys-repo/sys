import { type t } from './common.ts';

export function mergeAndReplace(key: string, value: unknown, target: t.CssProps) {
  Object.assign(target, value);
  delete target[key as keyof t.CssProps];
  return target;
}
