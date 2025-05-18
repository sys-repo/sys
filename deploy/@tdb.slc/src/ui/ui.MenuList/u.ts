import { type t } from './common.ts';

export function toLabel(item: t.MenuListItem) {
  const label = item.label ?? 'Untitled';
  if (typeof label === 'function') return label();
  return label;
}
