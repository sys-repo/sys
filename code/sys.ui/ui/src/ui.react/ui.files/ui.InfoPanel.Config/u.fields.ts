import { D, type t } from './common.ts';

type Field = t.Files.InfoPanel.Field;

/**
 * Resolve a valid, duplicate-free field list.
 */
export function resolveFields(input: readonly Field[] | undefined): Field[] {
  const fields = input ?? D.fields;
  const seen = new Set<Field>();
  const result: Field[] = [];

  fields.forEach((field) => {
    if (!isField(field) || seen.has(field)) return;
    seen.add(field);
    result.push(field);
  });

  return result;
}

/**
 * Toggle a field while preserving caller order and canonical insertion fallback.
 */
export function toggleField(fields: readonly Field[], field: Field, next: boolean): Field[] {
  const current = resolveFields(fields);
  if (!next) return current.filter((candidate) => candidate !== field);
  if (current.includes(field)) return current;

  const index = current.findIndex((candidate) => fieldOrder(candidate) > fieldOrder(field));
  if (index < 0) return [...current, field];
  return [...current.slice(0, index), field, ...current.slice(index)];
}

/**
 * Resolve rendered switch-row order from visible fields plus hidden canonical fields.
 */
export function toItemFields(fields: readonly Field[]): Field[] {
  const selected = resolveFields(fields);
  const missing = D.fields.filter((field) => !selected.includes(field));
  return [...selected, ...missing];
}

/**
 * Check whether an item ID is a public InfoPanel field.
 */
export function isField(input: string | undefined): input is Field {
  return D.fields.some((field) => field === input);
}

/**
 * Helpers:
 */
function fieldOrder(field: Field): number {
  return D.fields.indexOf(field);
}
