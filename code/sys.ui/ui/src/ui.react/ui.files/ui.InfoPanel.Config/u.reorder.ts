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
      const visible = new Set(fields);
      const next = e.next
        .map((item) => item.id)
        .filter(isField)
        .filter((field) => visible.has(field));
      if (next.length !== fields.length) return;
      props.onFieldsChange?.({ next });
    },
  };
}
