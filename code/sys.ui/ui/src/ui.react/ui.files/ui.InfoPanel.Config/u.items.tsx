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

const titleFields = [
  'title',
  'title.status',
  'title.status.label',
] as const satisfies readonly Field[];
const titleStatusFields = [
  'title.status',
  'title.status.label',
] as const satisfies readonly Field[];

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

    if (isTitleField(field)) {
      titleFields.forEach((candidate) => consumed.add(candidate));
      items.push(toTitleGroup(props, fields, itemFields));
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

function toTitleGroup(
  props: P,
  fields: readonly Field[],
  itemFields: readonly Field[],
): t.KeyValue.Switches.Group {
  const items: SwitchItem[] = [];
  const statusRows = titleStatusFields
    .filter((field) => itemFields.includes(field))
    .map((field) => toSwitchRow(props, fields, field));

  if (itemFields.includes('title')) items.push(toSwitchRow(props, fields, 'title'));
  if (statusRows.length > 0) {
    items.push({ id: 'group:title.status', kind: 'group', items: statusRows });
  }

  return { id: 'group:title', kind: 'group', items };
}

function toSwitchRow(props: P, fields: readonly Field[], field: Field): t.KeyValue.Switches.Row {
  return {
    id: field,
    label: D.fieldLabels[field] ?? field,
    value: fields.includes(field),
    x: fieldIndent(field),
    onToggle(next: boolean) {
      return props.onFieldsChange?.({ next: toggleField(fields, field, next) });
    },
  };
}

function isTitleField(field: Field): boolean {
  return titleFields.some((candidate) => candidate === field);
}

function fieldIndent(field: Field): t.KeyValue.Row['x'] | undefined {
  if (field === 'title.status') return [12, 0];
  if (field === 'title.status.label') return [12, 0];
}

function isVisibleItem(item: SwitchItem, visibleFields: ReadonlySet<Field>): boolean {
  if (isSwitchGroup(item)) return item.items.some((child) => isVisibleItem(child, visibleFields));
  if (isField(item.id)) return visibleFields.has(item.id);
  return false;
}

function isSwitchGroup(item: SwitchItem): item is SwitchGroup {
  return 'kind' in item && item.kind === 'group';
}
