import { Is, type t } from '../common.ts';

export function keyOf(item: t.KeyValue.Item, index: number, duplicateIds: ReadonlySet<string>) {
  const id = item.id;
  return isStableId(id) && !duplicateIds.has(id) ? id : index;
}

export function toDuplicateIds(items: readonly t.KeyValue.Item[]): ReadonlySet<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  items.forEach((item) => {
    const id = item.id;
    if (!isStableId(id)) return;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  });

  return duplicates;
}

function isStableId(id: unknown): id is string {
  return Is.string(id) && !Is.blank(id);
}
