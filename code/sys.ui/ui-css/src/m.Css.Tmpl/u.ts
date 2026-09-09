import { type t } from './common.ts';

export function mergeAndReplace(key: string, value: unknown, target: t.Style.Props) {
  Object.assign(target, value);
  delete target[key as keyof t.Style.Props];
  return target;
}
