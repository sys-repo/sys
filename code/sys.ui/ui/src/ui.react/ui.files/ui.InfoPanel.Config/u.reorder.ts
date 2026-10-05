import { type t } from './common.ts';
import { fieldFromItem, isDividerItem, isField } from './u.fields.ts';

type P = t.Files.InfoPanel.Config.Props;
type Field = t.Files.InfoPanel.Field;
type ConfigItem = t.Files.InfoPanel.Config.Item;

/**
 * Resolve KeyValue reorder config for visible InfoPanel fields/items.
 */
export function toReorder(
  props: P,
  visibleItems: readonly ConfigItem[],
  fields: readonly Field[],
): t.KeyValue.Reorder | undefined {
  if (props.reorder === false) return undefined;

  const itemSource = !!props.items;
  if (itemSource) {
    if (!props.onItemsChange) return undefined;
    return {
      enabled: true,
      onChange: (e) => {
        const next = toVisibleItems(e.next, visibleItems);
        if (!next) return;
        props.onItemsChange?.({ next });
      },
    };
  }

  if (!props.onFieldsChange) return undefined;
  return {
    enabled: true,
    onChange: (e) => {
      const next = toVisibleFields(e.next, fields);
      if (!next) return;
      props.onFieldsChange?.({ next });
    },
  };
}

function toVisibleItems(
  items: readonly t.KeyValue.Item[],
  current: readonly ConfigItem[],
): ConfigItem[] | undefined {
  const expectedFields = new Set(current.flatMap((item) => fieldFromItem(item) ?? []));
  const expectedDividers = new Set(current.flatMap((item) => isDividerItem(item) ? [item.id] : []));
  const seenFields = new Set<Field>();
  const seenDividers = new Set<string>();
  const next: ConfigItem[] = [];
  let duplicate = false;

  flattenItems(items).forEach((item) => {
    if (isDividerItem(item)) {
      if (!expectedDividers.has(item.id)) return;
      if (seenDividers.has(item.id)) duplicate = true;
      else {
        seenDividers.add(item.id);
        next.push(item);
      }
      return;
    }

    const field = fieldFromItem(item);
    if (!field || !expectedFields.has(field)) return;
    if (seenFields.has(field)) duplicate = true;
    else {
      seenFields.add(field);
      next.push(field);
    }
  });

  if (duplicate) return undefined;
  if (seenFields.size !== expectedFields.size) return undefined;
  if (seenDividers.size !== expectedDividers.size) return undefined;
  return next;
}

function toVisibleFields(
  items: readonly t.KeyValue.Item[],
  fields: readonly Field[],
): Field[] | undefined {
  const visible = new Set(fields);
  const seen = new Set<Field>();
  const next: Field[] = [];
  let duplicate = false;

  flattenFields(items).forEach((field) => {
    if (!visible.has(field)) return;
    if (seen.has(field)) {
      duplicate = true;
      return;
    }
    seen.add(field);
    next.push(field);
  });

  if (duplicate) return undefined;
  if (next.length !== fields.length) return undefined;
  return next;
}

function flattenItems(items: readonly t.KeyValue.Item[]): ConfigItem[] {
  const result: ConfigItem[] = [];

  items.forEach((item) => {
    if (item.kind === 'group') return result.push(...flattenItems(item.items));
    if (item.kind === 'hr' && item.id) return result.push({ kind: 'divider', id: item.id });
    if (isField(item.id)) result.push(item.id);
  });

  return result;
}

function flattenFields(items: readonly t.KeyValue.Item[]): Field[] {
  return flattenItems(items).flatMap((item) => fieldFromItem(item) ?? []);
}
