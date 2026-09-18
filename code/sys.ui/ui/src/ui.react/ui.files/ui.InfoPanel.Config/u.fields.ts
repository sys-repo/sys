import {
  fieldOrder,
  isField as isInfoPanelField,
  normalizeFields,
} from '../ui.InfoPanel/u.fields.ts';
import { D, Is, type t } from './common.ts';

type Field = t.Files.InfoPanel.Field;
type ConfigItem = t.Files.InfoPanel.Config.Item;
type DividerItem = { readonly kind: 'divider'; readonly id: string };
type ItemObject = { readonly kind?: unknown; readonly id?: unknown };

export const titleFields = [
  'title',
  'title.status',
  'title.status.label',
] as const satisfies readonly Field[];
export const titleStatusFields = [
  'title.status',
  'title.status.label',
] as const satisfies readonly Field[];

export { isInfoPanelField as isField };

/**
 * Resolve a valid, duplicate-free field list.
 */
export function resolveFields(input: readonly Field[] | undefined): Field[] {
  return normalizeFields(input ?? D.fields);
}

/**
 * Resolve visible structural config items from the item API or field-only fallback.
 */
export function resolveItems(
  items: readonly ConfigItem[] | undefined,
  fields: readonly Field[] | undefined,
): ConfigItem[] {
  return items ? normalizeItems(items) : fieldsToItems(resolveFields(fields));
}

/**
 * Resolve all rendered switch inputs: visible structural items followed by hidden field rows.
 */
export function toItemInputs(items: readonly ConfigItem[]): ConfigItem[] {
  const fields = fieldsFromItems(items);
  const missing = D.fields.filter((field) => !fields.includes(field));
  return [...normalizeItems(items), ...missing];
}

/**
 * Resolve rendered switch-row order from visible fields plus hidden canonical fields.
 */
export function toItemFields(fields: readonly Field[]): Field[] {
  const selected = resolveFields(fields);
  const missing = D.fields.filter((field) => !selected.includes(field));
  return [...selected, ...missing];
}

/** Extract visible field order from structural config items. */
export function fieldsFromItems(items: readonly ConfigItem[]): Field[] {
  return resolveFields(normalizeItems(items).flatMap((item) => fieldFromItem(item) ?? []));
}

/** Toggle a field while preserving caller order and canonical insertion fallback. */
export function toggleField(fields: readonly Field[], field: Field, next: boolean): Field[] {
  const current = resolveFields(fields);
  if (!next) return removeField(current, field);

  const result = [...current];
  requiredFields(field).forEach((candidate) => insertField(result, candidate));
  return resolveFields(result);
}

/** Toggle a field in the structural item model while preserving divider identity/order. */
export function toggleItem(
  items: readonly ConfigItem[],
  field: Field,
  next: boolean,
): ConfigItem[] {
  const current = normalizeItems(items);
  if (!next) return removeFieldItems(current, field);

  const nextFields = toggleField(fieldsFromItems(current), field, true);
  return mergeFieldsIntoItems(current, nextFields);
}

/** Convert visible fields to the structural item shorthand. */
export function fieldsToItems(fields: readonly Field[]): Field[] {
  return resolveFields(fields);
}

/** True when an item is an identity-bearing divider. */
export function isDividerItem(item: ConfigItem): item is DividerItem {
  return isItemObject(item) && item.kind === 'divider' && Is.string(item.id) && !Is.blank(item.id);
}

/** Resolve a config item to its field, if any. */
export function fieldFromItem(item: ConfigItem): Field | undefined {
  return Is.string(item) && isInfoPanelField(item) ? item : undefined;
}

/**
 * Helpers:
 */
function normalizeItems(items: readonly ConfigItem[]): ConfigItem[] {
  const result: ConfigItem[] = [];
  const seenFields = new Set<Field>();
  const seenDividers = new Set<string>();

  items.forEach((item) => {
    if (isDividerItem(item)) {
      if (seenDividers.has(item.id)) return;
      seenDividers.add(item.id);
      result.push({ kind: 'divider', id: item.id });
      return;
    }

    const field = fieldFromItem(item);
    if (!field) return;
    requiredFields(field).forEach((candidate) => {
      if (seenFields.has(candidate)) return;
      seenFields.add(candidate);
      result.push(candidate);
    });
  });

  return coalesceTitleFields(result);
}

function coalesceTitleFields(items: readonly ConfigItem[]): ConfigItem[] {
  let firstTitleIndex = -1;
  const seenTitleFields = new Set<Field>();

  items.forEach((item, index) => {
    const field = fieldFromItem(item);
    if (!field || !isTitleField(field)) return;
    if (firstTitleIndex < 0) firstTitleIndex = index;
    seenTitleFields.add(field);
  });

  if (firstTitleIndex < 0) return [...items];

  const next = items.filter((item) => {
    const field = fieldFromItem(item);
    return !field || !isTitleField(field);
  });
  const grouped = titleFields.filter((field) => seenTitleFields.has(field));
  next.splice(firstTitleIndex, 0, ...grouped);
  return next;
}

export function isTitleField(field: Field): boolean {
  return titleFields.some((candidate) => candidate === field);
}

function isItemObject(item: unknown): item is ItemObject {
  return Is.object(item);
}

function removeFieldItems(items: readonly ConfigItem[], field: Field): ConfigItem[] {
  const remove = new Set<Field>(fieldAndDescendants(field));
  return normalizeItems(items).filter((item) => {
    const candidate = fieldFromItem(item);
    return !candidate || !remove.has(candidate);
  });
}

function mergeFieldsIntoItems(
  items: readonly ConfigItem[],
  fields: readonly Field[],
): ConfigItem[] {
  const wanted = new Set(resolveFields(fields));
  const result = normalizeItems(items).filter((item) => {
    const field = fieldFromItem(item);
    return !field || wanted.has(field);
  });

  resolveFields(fields).forEach((field) => {
    if (result.some((item) => fieldFromItem(item) === field)) return;
    insertFieldItem(result, field);
  });

  return normalizeItems(result);
}

function insertFieldItem(items: ConfigItem[], field: Field) {
  const index = items.findIndex((item) => {
    const candidate = fieldFromItem(item);
    return candidate ? fieldOrder(candidate) > fieldOrder(field) : false;
  });
  if (index < 0) items.push(field);
  else items.splice(index, 0, field);
}

function requiredFields(field: Field): Field[] {
  if (field === 'title.status') return ['title', field];
  if (field === 'title.status.label') return [...titleFields];
  return [field];
}

function removeField(fields: readonly Field[], field: Field): Field[] {
  const remove = new Set<Field>(fieldAndDescendants(field));
  return fields.filter((candidate) => !remove.has(candidate));
}

function fieldAndDescendants(field: Field): Field[] {
  if (field === 'title') return [...titleFields];
  if (field === 'title.status') return [...titleStatusFields];
  return [field];
}

function insertField(fields: Field[], field: Field) {
  if (fields.includes(field)) return;

  if (field === 'title.status' && fields.includes('title')) {
    fields.splice(fields.indexOf('title') + 1, 0, field);
    return;
  }

  if (field === 'title.status.label' && fields.includes('title.status')) {
    fields.splice(fields.indexOf('title.status') + 1, 0, field);
    return;
  }

  const index = fields.findIndex((candidate) => fieldOrder(candidate) > fieldOrder(field));
  if (index < 0) fields.push(field);
  else fields.splice(index, 0, field);
}
