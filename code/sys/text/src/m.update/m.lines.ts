import { Is, type t } from './common.ts';
import { apply, insert } from './u.apply.ts';
import { lineSpans, newlineOf } from './u.scan.ts';

/** Update text by visiting each original physical line once. */
export const lines: t.TextUpdate.Lines = (text, visit, options = {}) => {
  const before = text;
  const spans = lineSpans(before);
  const edits: t.TextUpdate.Edit[] = [];

  if (Is.func(visit)) {
    const lineTexts = Object.freeze(spans.map((span) => span.text));
    for (const span of spans) {
      const context = lineContext(before, span, spans, lineTexts, options);
      const result = visit(context);
      const next: readonly t.TextUpdate.Line.EditResult[] = isEditResults(result)
        ? result
        : result
        ? [result]
        : [];

      for (const item of next) {
        if (isInvalid(item)) return invalid(before, item.error);
        edits.push(item);
      }
    }
  }

  const applied = apply(before, edits);
  if (!applied.ok) return applied;

  const normalized = normalize(applied.after, before, options);
  if (normalized === applied.after) return applied;

  const change: t.TextUpdate.Change = {
    op: changeOp(applied.after, normalized),
    range: { start: 0, end: applied.after.length },
    before: applied.after,
    after: normalized,
    label: 'normalize',
  };

  return {
    ok: true,
    changed: before !== normalized,
    before,
    after: normalized,
    changes: [...applied.changes, change],
  };
};

/**
 * Helpers:
 */
type VisitResult = ReturnType<t.TextUpdate.Line.Visit>;

function lineContext(
  source: string,
  span: t.TextUpdate.Line.Span,
  spans: readonly t.TextUpdate.Line.Span[],
  lineTexts: readonly string[],
  options: t.TextUpdate.Line.Options,
): t.TextUpdate.Line.Context {
  const newline = resolveNewline(source, options);
  const rawStart = span.range.start;
  const rawEnd = span.range.end;
  const textStart = span.textRange.start;
  const textEnd = span.textRange.end;

  const invalidLineText = (text: string): t.TextUpdate.Line.InvalidEdit | undefined => {
    if (!/[\r\n]/.test(text)) return undefined;
    return {
      error: {
        reason: 'invalid-line-text',
        message: 'Line helper text must not contain CR or LF characters',
      },
    };
  };

  const insertLines = (at: number, position: 'before' | 'after', values: readonly string[]) => {
    for (const value of values) {
      const invalid = invalidLineText(value);
      if (invalid) return invalid;
    }

    const text = formatInsertedLines(values, newline, position, span);
    return insert(at, text);
  };

  return {
    ...span,
    range: { start: rawStart, end: rawEnd },
    textRange: { start: textStart, end: textEnd },
    get is() {
      return { first: span.index === 0, last: span.index === spans.length - 1 };
    },
    get lines() {
      return lineTexts;
    },
    replace(text) {
      const invalid = invalidLineText(text);
      if (invalid) return invalid;
      return { range: { start: textStart, end: textEnd }, text };
    },
    delete() {
      return { range: { start: rawStart, end: rawEnd }, text: '' };
    },
    insertBefore(...values) {
      return insertLines(rawStart, 'before', values);
    },
    insertAfter(...values) {
      return insertLines(rawEnd, 'after', values);
    },
  };
}

function formatInsertedLines(
  values: readonly string[],
  newline: t.TextUpdate.Line.Newline,
  position: 'before' | 'after',
  span: t.TextUpdate.Line.Span,
): string {
  if (values.length === 0) return '';
  if (position === 'before') return values.map((value) => `${value}${newline}`).join('');
  if (span.newline) return values.map((value) => `${value}${newline}`).join('');
  return `${newline}${values.join(newline)}`;
}

function changeOp(before: string, after: string): t.TextUpdate.Change['op'] {
  if (before.length === 0 && after.length > 0) return 'insert';
  if (after.length === 0) return 'delete';
  return 'replace';
}

function normalize(
  text: string,
  source: string,
  options: t.TextUpdate.Line.Options,
): string {
  const newline = resolveNewline(source, options);
  const next = options.newline && options.newline !== 'preserve'
    ? normalizeNewlines(text, options.newline)
    : text;

  if (options.eof === 'ensure') return ensureEof(next, newline);
  if (options.eof === 'strip') return stripEof(next);
  return next;
}

function normalizeNewlines(text: string, newline: t.TextUpdate.Line.Newline): string {
  return lineSpans(text).map((span) => `${span.text}${span.newline ? newline : ''}`).join('');
}

function ensureEof(text: string, newline: t.TextUpdate.Line.Newline): string {
  if (text.length === 0) return newline;
  if (text.endsWith('\n')) return text;
  return `${text}${newline}`;
}

function stripEof(text: string): string {
  if (text.endsWith('\r\n')) return text.slice(0, -2);
  if (text.endsWith('\n')) return text.slice(0, -1);
  return text;
}

function resolveNewline(
  text: string,
  options: t.TextUpdate.Line.Options,
): t.TextUpdate.Line.Newline {
  return options.newline && options.newline !== 'preserve' ? options.newline : newlineOf(text);
}

function isEditResults(value: VisitResult): value is readonly t.TextUpdate.Line.EditResult[] {
  return Is.array(value);
}

function isInvalid(value: t.TextUpdate.Line.EditResult): value is t.TextUpdate.Line.InvalidEdit {
  return Is.record(value) && isUpdateError((value as { error?: unknown }).error);
}

function isUpdateError(value: unknown): value is t.TextUpdate.UpdateError {
  return Is.record(value) && Is.string(value.reason) && Is.string(value.message);
}

function invalid(before: string, error: t.TextUpdate.UpdateError): t.TextUpdate.Result {
  return { ok: false, changed: false, before, after: before, changes: [], error };
}
