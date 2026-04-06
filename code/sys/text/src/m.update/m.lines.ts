import { type t } from './common.ts';

/** Update text by traversing and mutating it line-by-line. */
export const lines: t.TextUpdate.Lines = (text, modify) => {
  const changes: t.TextUpdate.Change[] = [];
  const before = ensureEof(text);

  if (typeof modify !== 'function') {
    return { changed: false, before, after: before, changes };
  }

  const source = before.split('\n');

  for (let index = 0; index < source.length; ) {
    if (index >= source.length) throw new Error('Overstepped array bounds.');

    let snapshot: readonly string[] | undefined;

    const line: t.TextUpdate.Line = {
      get text() {
        return source[index];
      },
      get index() {
        return index;
      },
      get is() {
        return {
          first: index === 0,
          last: index === source.length - 1,
        };
      },
      get lines() {
        return snapshot || (snapshot = [...source]);
      },
      modify(next) {
        const current = line.text;
        if (next === current) return;
        source[index] = next;
        changes.push({ op: 'modify', line: { index }, before: current, after: next });
      },
      insert(next, position = 'before') {
        const at = position === 'before' ? index : index + 1;
        source.splice(at, 0, next);
        changes.push({ op: 'insert', line: { index }, before: '', after: next });
        snapshot = undefined;
        index += 1;
      },
      delete() {
        const current = line.text;
        source.splice(index, 1);
        changes.push({ op: 'delete', line: { index }, before: current, after: '' });
        snapshot = undefined;
        index -= 1;
      },
    };

    modify(line);
    index += 1;
  }

  const after = ensureEof(source.join('\n'));
  return { changed: changes.length > 0, before, after, changes };
};

/** Normalize text to a trailing newline. */
const ensureEof = (text = '') => (text.endsWith('\n') ? text : `${text}\n`);
