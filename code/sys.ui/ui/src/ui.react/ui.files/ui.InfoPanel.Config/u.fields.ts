import { fieldOrder, isField as isInfoPanelField, normalizeFields } from '../ui.InfoPanel/u.fields.ts';
import { D, type t } from './common.ts';

type Field = t.Files.InfoPanel.Field;

export { isInfoPanelField as isField };

/**
 * Resolve a valid, duplicate-free field list.
 */
export function resolveFields(input: readonly Field[] | undefined): Field[] {
  return normalizeFields(input ?? D.fields);
}

/**
 * Toggle a field while preserving caller order and canonical insertion fallback.
 */
export function toggleField(fields: readonly Field[], field: Field, next: boolean): Field[] {
  const current = resolveFields(fields);
  if (!next) return removeField(current, field);

  const result = [...current];
  requiredFields(field).forEach((candidate) => insertField(result, candidate));
  return resolveFields(result);
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
 * Helpers:
 */
function requiredFields(field: Field): Field[] {
  if (field === 'title.status') return ['title', 'title.status'];
  if (field === 'title.status.label') return ['title', 'title.status', 'title.status.label'];
  return [field];
}

function removeField(fields: readonly Field[], field: Field): Field[] {
  const remove = new Set<Field>(fieldAndDescendants(field));
  return fields.filter((candidate) => !remove.has(candidate));
}

function fieldAndDescendants(field: Field): Field[] {
  if (field === 'title') return ['title', 'title.status', 'title.status.label'];
  if (field === 'title.status') return ['title.status', 'title.status.label'];
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
