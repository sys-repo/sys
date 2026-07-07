import { D, type t } from './common.ts';
import { toggleField } from './u.fields.ts';

type P = t.Files.InfoPanel.Config.Props;
type Field = t.Files.InfoPanel.Field;

/**
 * Project InfoPanel config props into KeyValue switch rows.
 */
export function toSwitchItems(
  props: P,
  fields: readonly Field[],
  itemFields: readonly Field[],
): t.KeyValue.Switches.Item[] {
  const items: t.KeyValue.Switches.Item[] = itemFields.map((field) => {
    return {
      id: field,
      label: D.fieldLabels[field] ?? field,
      value: fields.includes(field),
      onToggle(next: boolean) {
        return props.onFieldsChange?.({ next: toggleField(fields, field, next) });
      },
    };
  });

  return items;
}
