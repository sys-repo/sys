import { Is, Num, type t } from './common.ts';

/** Build a zero-width insertion edit. */
export const insert: t.TextUpdate.Insert = (at, text, label) => ({
  range: { start: at, end: at },
  text,
  label,
});

/** Build a replacement edit. */
export const replace: t.TextUpdate.Replace = (range, text, label) => ({
  range: { start: range.start, end: range.end },
  text,
  label,
});

/** Build a deletion edit. */
export const deleteRange: t.TextUpdate.Delete = (range, label) => ({
  range: { start: range.start, end: range.end },
  text: '',
  label,
});

/** Apply exact range edits to text. */
export const apply: t.TextUpdate.Apply = (text, edits = []) => {
  const before = text;
  if (edits.length === 0) return ok(before, before, []);

  const plan = snapshotPlan(edits);
  if (!plan.ok) return fail(before, plan.error);

  const invalid = validate(before, plan.edits);
  if (invalid) return fail(before, invalid);

  const indexed = plan.edits.map((edit, index) => ({ edit, index }));
  const inserts = indexed
    .filter((item) => item.edit.range.start === item.edit.range.end)
    .sort((a, b) => a.edit.range.start - b.edit.range.start || a.index - b.index);
  const replacements = indexed
    .filter((item) => item.edit.range.start !== item.edit.range.end)
    .sort((a, b) => a.edit.range.start - b.edit.range.start || a.index - b.index);

  let after = '';
  let cursor = 0;
  let insertIndex = 0;
  const changes: t.TextUpdate.Change[] = [];

  const appendTextUntil = (offset: number) => {
    if (offset <= cursor) return;
    after += before.slice(cursor, offset);
    cursor = offset;
  };

  const appendInsert = (item: IndexedEdit) => {
    const edit = item.edit;
    if (edit.text.length === 0) return;
    after += edit.text;
    changes.push({
      op: 'insert',
      range: edit.range,
      before: '',
      after: edit.text,
      label: edit.label,
    });
  };

  const appendInsertsBefore = (offset: number) => {
    while (insertIndex < inserts.length && inserts[insertIndex]!.edit.range.start < offset) {
      const item = inserts[insertIndex]!;
      appendTextUntil(item.edit.range.start);
      appendInsert(item);
      insertIndex += 1;
    }
  };

  const appendInsertsAt = (offset: number) => {
    while (insertIndex < inserts.length && inserts[insertIndex]!.edit.range.start === offset) {
      appendInsert(inserts[insertIndex]!);
      insertIndex += 1;
    }
  };

  for (const item of replacements) {
    const edit = item.edit;
    appendInsertsBefore(edit.range.start);
    appendTextUntil(edit.range.start);
    appendInsertsAt(edit.range.start);

    const replaced = before.slice(edit.range.start, edit.range.end);
    after += edit.text;
    cursor = edit.range.end;

    if (replaced !== edit.text) {
      changes.push({
        op: edit.text.length === 0 ? 'delete' : 'replace',
        range: edit.range,
        before: replaced,
        after: edit.text,
        label: edit.label,
      });
    }

    appendInsertsAt(edit.range.end);
  }

  while (insertIndex < inserts.length) {
    const item = inserts[insertIndex]!;
    appendTextUntil(item.edit.range.start);
    appendInsert(item);
    insertIndex += 1;
  }
  appendTextUntil(before.length);

  return ok(before, after, changes);
};

/**
 * Helpers:
 */
type IndexedEdit = { readonly edit: t.TextUpdate.Edit; readonly index: number };
type EditPlan =
  | { readonly ok: true; readonly edits: readonly t.TextUpdate.Edit[] }
  | { readonly ok: false; readonly error: t.TextUpdate.UpdateError };

function ok(
  before: string,
  after: string,
  changes: readonly t.TextUpdate.Change[],
): t.TextUpdate.Result {
  return { ok: true, changed: before !== after, before, after, changes };
}

function fail(before: string, error: t.TextUpdate.UpdateError): t.TextUpdate.Result {
  return { ok: false, changed: false, before, after: before, changes: [], error };
}

function snapshotPlan(edits: readonly t.TextUpdate.Edit[]): EditPlan {
  const next: t.TextUpdate.Edit[] = [];

  for (const edit of edits) {
    if (!isEdit(edit)) return { ok: false, error: error('invalid-range', 'Invalid edit shape') };
    next.push({
      range: { start: edit.range.start, end: edit.range.end },
      text: edit.text,
      label: edit.label,
    });
  }

  return { ok: true, edits: next };
}

function validate(
  text: string,
  edits: readonly t.TextUpdate.Edit[],
): t.TextUpdate.UpdateError | undefined {
  for (const edit of edits) {
    const error = validateRange(text, edit);
    if (error) return error;
  }

  const replacements = edits
    .filter((edit) => edit.range.start !== edit.range.end)
    .sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end);

  for (let i = 1; i < replacements.length; i++) {
    const prev = replacements[i - 1]!;
    const next = replacements[i]!;
    if (prev.range.end > next.range.start) {
      return error('overlapping-edits', 'Edit ranges must not overlap', next);
    }
  }

  const inserts = edits.filter((edit) => edit.range.start === edit.range.end);
  for (const insert of inserts) {
    for (const replacement of replacements) {
      if (
        replacement.range.start < insert.range.start && insert.range.start < replacement.range.end
      ) {
        return error(
          'overlapping-edits',
          'Insert offset must not fall inside a replacement range',
          insert,
        );
      }
    }
  }

  return undefined;
}

function validateRange(
  text: string,
  edit: t.TextUpdate.Edit,
): t.TextUpdate.UpdateError | undefined {
  if (!isEdit(edit)) return error('invalid-range', 'Invalid edit shape');

  const { start, end } = edit.range;
  if (
    !Num.Is.int(start) || !Num.Is.int(end) || start < 0 || end < start || end > text.length
  ) {
    return error('invalid-range', `Invalid edit range: ${start}..${end}`, edit);
  }
  if (splitsSurrogatePair(text, start) || splitsSurrogatePair(text, end)) {
    return error('split-surrogate-pair', 'Edit range must not split a UTF-16 surrogate pair', edit);
  }
  return undefined;
}

function isEdit(value: unknown): value is t.TextUpdate.Edit {
  if (!Is.record(value)) return false;
  if (!Is.record(value.range)) return false;
  if (!Is.string(value.text)) return false;
  if (value.label !== undefined && !Is.string(value.label)) return false;
  return true;
}

function splitsSurrogatePair(text: string, offset: number): boolean {
  if (offset <= 0 || offset >= text.length) return false;
  return isHigh(text.charCodeAt(offset - 1)) && isLow(text.charCodeAt(offset));
}

function isHigh(value: number): boolean {
  return value >= 0xd800 && value <= 0xdbff;
}

function isLow(value: number): boolean {
  return value >= 0xdc00 && value <= 0xdfff;
}

function error(
  reason: t.TextUpdate.UpdateErrorReason,
  message: string,
  edit?: t.TextUpdate.Edit,
): t.TextUpdate.UpdateError {
  return { reason, message, edit };
}
