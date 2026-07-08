import { D, type t } from './common.ts';
import { isField, toggleField } from './u.fields.ts';

type P = t.Files.InfoPanel.Config.Props;
type Field = t.Files.InfoPanel.Field;
type SwitchItem = t.KeyValue.Switches.Item;
type SwitchGroup = t.KeyValue.Switches.Group;

type SwitchItemSections = {
  readonly visible: SwitchItem[];
  readonly hidden: SwitchItem[];
};

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
): SwitchItem[] {
  const items: SwitchItem[] = [];
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

export function toSwitchItemSections(
  items: readonly SwitchItem[],
  fields: readonly Field[],
): SwitchItemSections {
  const visibleFields = new Set(fields);
  const visible: SwitchItem[] = [];
  const hidden: SwitchItem[] = [];

  items.forEach((item) => {
    const target = isVisibleItem(item, visibleFields) ? visible : hidden;
    target.push(item);
  });

  return { visible, hidden };
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

function isVisibleItem(item: SwitchItem, visibleFields: ReadonlySet<Field>): boolean {
  if (isSwitchGroup(item)) return item.items.some((child) => isVisibleItem(child, visibleFields));
  if (isField(item.id)) return visibleFields.has(item.id);
  return false;
}

function isSwitchGroup(item: SwitchItem): item is SwitchGroup {
  return 'kind' in item && item.kind === 'group';
}
