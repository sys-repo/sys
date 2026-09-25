import { D, Is, type t } from './common.ts';

type Field = t.Files.InfoPanel.Field;

/**
 * Resolve subject default fields into a valid, dependency-complete field list.
 */
export function resolveFields(input: readonly Field[] | undefined): Field[] {
  return normalizeFields(input ?? D.fields);
}

/**
 * Normalize arbitrary runtime field input into public InfoPanel fields.
 */
export function normalizeFields(input: readonly unknown[]): Field[] {
  const expanded: Field[] = [];

  input.forEach((field) => {
    toInputFields(field).forEach((candidate) => appendField(expanded, candidate));
  });

  return normalizeFieldTree(expanded);
}

/**
 * Check whether an item ID is a public InfoPanel field.
 */
export function isField(input: string | undefined): input is Field {
  if (!Is.string(input)) return false;
  return D.fieldOrder.some((field) => field === input);
}

/**
 * Resolve canonical field ordering.
 */
export function fieldOrder(field: Field): number {
  return D.fieldOrder.indexOf(field);
}

/**
 * Helpers:
 */
function normalizeFieldTree(fields: readonly Field[]): Field[] {
  const result: Field[] = [];
  fields.forEach((field) => appendWithParents(result, field));
  return result;
}

function appendWithParents(fields: Field[], field: Field) {
  if (field === 'title.status') appendField(fields, 'title');
  if (field === 'title.status.label') {
    appendField(fields, 'title');
    appendField(fields, 'title.status');
  }
  appendField(fields, field);
}

function appendField(fields: Field[], field: Field) {
  if (fields.includes(field)) return;
  fields.push(field);
}

function toInputFields(input: unknown): Field[] {
  if (!Is.string(input)) return [];
  if (input === 'status:title') return ['title', 'title.status', 'title.status.label'];
  if (isField(input)) return [input];
  return [];
}
