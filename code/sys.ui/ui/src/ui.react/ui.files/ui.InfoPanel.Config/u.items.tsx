import { D, type t } from './common.ts';
import {
  fieldFromItem,
  isDividerItem,
  isField,
  isTitleField,
  titleFields,
  titleStatusFields,
  toggleField,
  toggleItem,
} from './u.fields.ts';

type P = t.Files.InfoPanel.Config.Props;
type Field = t.Files.InfoPanel.Field;
type ConfigItem = t.Files.InfoPanel.Config.Item;
type SwitchItem = t.KeyValue.Switches.Item;
type SwitchGroup = t.KeyValue.Switches.Group;

type SwitchItemSections = {
  readonly visible: SwitchItem[];
  readonly hidden: SwitchItem[];
};

/**
 * Project InfoPanel config props into KeyValue switch rows.
 */
export function toSwitchItems(
  props: P,
  fields: readonly Field[],
  itemInputs: readonly ConfigItem[],
  visibleItems: readonly ConfigItem[],
): SwitchItem[] {
  const items: SwitchItem[] = [];
  const consumed = new Set<Field>();

  itemInputs.forEach((input) => {
    if (isDividerItem(input)) {
      items.push({ id: input.id, kind: 'hr' });
      return;
    }

    const field = fieldFromItem(input);
    if (!field) return;
    if (consumed.has(field)) return;

    if (isTitleField(field)) {
      titleFields.forEach((candidate) => consumed.add(candidate));
      items.push(toTitleGroup(props, fields, itemInputs, visibleItems));
      return;
    }

    consumed.add(field);
    items.push(toSwitchRow(props, fields, visibleItems, field));
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
  itemInputs: readonly ConfigItem[],
  visibleItems: readonly ConfigItem[],
): t.KeyValue.Switches.Group {
  const itemFields = itemInputs.flatMap((item) => fieldFromItem(item) ?? []);
  const items: SwitchItem[] = [];
  const statusRows = titleStatusFields
    .filter((field) => itemFields.includes(field))
    .map((field) => toSwitchRow(props, fields, visibleItems, field));

  if (itemFields.includes('title')) items.push(toSwitchRow(props, fields, visibleItems, 'title'));
  if (statusRows.length > 0) {
    items.push({ id: 'group:title.status', kind: 'group', items: statusRows });
  }

  return { id: 'group:title', kind: 'group', items };
}

function toSwitchRow(
  props: P,
  fields: readonly Field[],
  visibleItems: readonly ConfigItem[],
  field: Field,
): t.KeyValue.Switches.Row {
  const itemSource = !!props.items;
  const onToggle = itemSource && props.onItemsChange
    ? (e: t.KeyValue.Switches.Item.Toggle.Args) => {
      props.onItemsChange?.({ next: toggleItem(visibleItems, field, e.next) });
    }
    : !itemSource && props.onFieldsChange
    ? (e: t.KeyValue.Switches.Item.Toggle.Args) => {
      props.onFieldsChange?.({ next: toggleField(fields, field, e.next) });
    }
    : undefined;

  return {
    id: field,
    label: D.fieldLabels[field] ?? field,
    value: fields.includes(field),
    x: fieldIndent(field),
    onToggle,
  };
}

function fieldIndent(field: Field): t.KeyValue.Item.Row['x'] | undefined {
  if (field === 'title.status') return [12, 0];
  if (field === 'title.status.label') return [12, 0];
}

function isVisibleItem(item: SwitchItem, visibleFields: ReadonlySet<Field>): boolean {
  if ('kind' in item && item.kind === 'hr') return true;
  if (isSwitchGroup(item)) return item.items.some((child) => isVisibleItem(child, visibleFields));
  if (isField(item.id)) return visibleFields.has(item.id);
  return false;
}

function isSwitchGroup(item: SwitchItem): item is SwitchGroup {
  return 'kind' in item && item.kind === 'group';
}
