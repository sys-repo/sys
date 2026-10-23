import { type t } from './common.ts';

export function toggle(selected: t.BulletList.Selected | undefined, id: string): string[] {
  const list = Array.isArray(selected) ? [...selected] : selected ? [selected] : [];
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}
