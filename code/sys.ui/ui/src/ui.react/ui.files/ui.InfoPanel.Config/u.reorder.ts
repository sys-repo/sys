import { type t } from './common.ts';
import { isField } from './u.fields.ts';

type P = t.Files.InfoPanel.Config.Props;
type Field = t.Files.InfoPanel.Field;

/**
 * Resolve KeyValue reorder config for visible InfoPanel fields.
 */
export function toReorder(props: P, fields: readonly Field[]): t.KeyValue.Reorder | undefined {
  if (props.reorder === false || !props.onFieldsChange) return undefined;

  return {
    enabled: true,
    onChange: (e) => {
      const next = toVisibleFields(e.next, fields);
      if (!next) return;
      props.onFieldsChange?.({ next });
    },
  };
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

function flattenFields(items: readonly t.KeyValue.Item[]): Field[] {
  const fields: Field[] = [];

  items.forEach((item) => {
    if (item.kind === 'group') return fields.push(...flattenFields(item.items));
    if (isField(item.id)) fields.push(item.id);
  });

  return fields;
}
