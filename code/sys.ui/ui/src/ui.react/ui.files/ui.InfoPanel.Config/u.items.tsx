import { D, type t } from './common.ts';
import { toggleField } from './u.fields.ts';

type P = t.Files.InfoPanel.Config.Props;
type Field = t.Files.InfoPanel.Field;

type FieldGroup = {
  readonly id: string;
  readonly fields: readonly Field[];
};

const statusGroup: FieldGroup = {
  id: 'group:status',
  fields: ['status', 'status:title'],
};

const fieldGroups = [statusGroup] as const;

/**
 * Project InfoPanel config props into KeyValue switch rows.
 */
export function toSwitchItems(
  props: P,
  fields: readonly Field[],
  itemFields: readonly Field[],
): t.KeyValue.Switches.Item[] {
  const items: t.KeyValue.Switches.Item[] = [];
  const consumed = new Set<Field>();

  itemFields.forEach((field) => {
    if (consumed.has(field)) return;

    const group = groupForField(field);
    if (group) {
      const groupFields = itemFields.filter((candidate) => group.fields.includes(candidate));
      groupFields.forEach((candidate) => consumed.add(candidate));
      items.push({
        id: group.id,
        kind: 'group',
        items: groupFields.map((candidate) => toSwitchRow(props, fields, candidate)),
      });
      return;
    }

    consumed.add(field);
    items.push(toSwitchRow(props, fields, field));
  });

  return items;
}

function toSwitchRow(props: P, fields: readonly Field[], field: Field): t.KeyValue.Switches.Row {
  return {
    id: field,
    label: D.fieldLabels[field] ?? field,
    value: fields.includes(field),
    onToggle(next: boolean) {
      return props.onFieldsChange?.({ next: toggleField(fields, field, next) });
    },
  };
}

function groupForField(field: Field): FieldGroup | undefined {
  return fieldGroups.find((group) => group.fields.includes(field));
}
