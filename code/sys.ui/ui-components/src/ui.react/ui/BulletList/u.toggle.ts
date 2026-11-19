import { type t, Is } from './common.ts';

/**
 * Toggle membership without mutating the caller's selection, including empty-string IDs.
 */
export function toggle<Id extends string = string>(
  selected: t.BulletList.Selected<Id> | undefined,
  id: Id,
): readonly Id[] {
  const list = selected === undefined ? [] : Is.string(selected) ? [selected] : selected;
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}
