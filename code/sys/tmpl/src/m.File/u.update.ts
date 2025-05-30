import { type t, Err, Fs, Is } from './common.ts';

/**
 * Update a file's content after it has been
 * laid down on the file-system within a template.
 */
export const update = (<P extends t.StringPath | t.StringPath[]>(
  path: P,
  modify?: t.TmplLineUpdate,
) =>
  Array.isArray(path)
    ? Promise.all(path.map((p) => updatePath(p, modify)))
    : updatePath(path, modify)) as t.TmplFileLib['update'];

/**
 * Implementation (single path):
 */
async function updatePath(
  path: t.StringPath,
  modify?: t.TmplLineUpdate,
): Promise<t.TmplFileUpdateResponse> {
  /**
   * Response scaffold:
   */
  type R = t.TmplFileUpdateResponse;
  const changes: t.TmplFileChange[] = [];
  const res: t.DeepMutable<R> = {
    get changed() {
      return res.changes.length > 0;
    },
    get changes() {
      return changes;
    },
    before: '',
    after: '',
  };

  const withError = (err: string | t.StdError) => {
    res.error = Is.string(err) ? Err.std(err) : err;
    return res;
  };

  /**
   * Pre-flight guard checks:
   */
  if (!(await Fs.exists(path))) return withError(`The given file path does not exist: ${path}`);
  if (!(await Fs.Is.file(path))) return withError(`The given path is not a file: ${path}`);

  const f = await Fs.readText(path);
  res.before = ensureEOF(f.data);
  if (f.error) return withError(f.error);
  if (typeof modify !== 'function') {
    res.after = res.before;
    return res;
  }

  /**
   * Core traversal:
   */
  const lines: string[] = res.before.split('\n');

  for (let i = 0; i < lines.length; ) {
    if (i >= lines.length) throw new Error('Overstepped array bounds.');

    let _lines: string[] | undefined;

    const payload: t.TmplLineUpdateArgs = {
      get file() {
        return {
          path,
          get lines() {
            return _lines || (_lines = [...lines]); // ← (immutable snapshot).
          },
        };
      },
      is: { first: i === 0, last: i === lines.length - 1 },
      get text() {
        return lines[i];
      },
      get index() {
        return i;
      },
      modify(next) {
        const text = payload.text;
        if (next !== text) {
          const op = 'modify';
          lines[i] = next;
          res.changes.push({ op, line: { index: i }, before: text, after: next });
        }
      },
      insert(insertText: string, position = 'before') {
        const op = 'insert';
        lines.splice(position === 'before' ? i : i + 1, 0, insertText);
        res.changes.push({ op, line: { index: i }, before: '', after: insertText });
        _lines = undefined;
        i += 1;
      },
    };

    const maybePromise = modify(payload);
    if (Is.promise(maybePromise)) await maybePromise;

    i += 1;
  }

  /**
   * Persist (file-system):
   */
  res.after = ensureEOF(lines.join('\n'));
  if (res.changed) await Fs.write(path, res.after, { force: true });
  return res;
}

/**
 * Helpers:
 */
const ensureEOF = (txt = '') => (txt.endsWith('\n') ? txt : `${txt}\n`);
