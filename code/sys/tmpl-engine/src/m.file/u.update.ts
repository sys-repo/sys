import { Update } from '@sys/text/update';
import { type t, Err, Fs, Is, Json } from './common.ts';

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

export const updateJson: t.TmplFileLib['updateJson'] = async <T extends t.Json>(
  path: t.StringPath,
  modify?: t.TmplJsonUpdate<T>,
) => {
  const withError = (err: string | t.StdError, args: Partial<t.TmplJsonFileUpdateResponse<T>> = {}) =>
    ({
      changed: false,
      before: args.before ?? '',
      after: args.after ?? '',
      data: args.data ?? { before: {} as T, after: {} as T },
      error: Is.string(err) ? Err.std(err) : err,
    }) satisfies t.TmplJsonFileUpdateResponse<T>;

  if (!(await Fs.exists(path))) return withError(`The given file path does not exist: ${path}`);
  if (!(await Fs.Is.file(path))) return withError(`The given path is not a file: ${path}`);

  const beforeText = await Fs.readText(path);
  if (beforeText.error) return withError(beforeText.error);
  const before = ensureEOF(beforeText.data);

  const beforeJson = await Fs.readJson<T>(path);
  if (beforeJson.error || beforeJson.data === undefined) {
    return withError(beforeJson.error ?? `Failed to parse JSON file: ${path}`, { before });
  }

  const next = structuredClone(beforeJson.data) as T;
  if (typeof modify === 'function') await modify(next);

  const after = `${Json.stringify(next, 2)}\n`;
  const changed = before !== after;

  if (changed) {
    const write = await Fs.writeJson(path, next, { force: true });
    if (write.error) return withError(write.error, { before, after, data: { before: beforeJson.data, after: next } });
  }

  return {
    changed,
    before,
    after,
    data: { before: beforeJson.data, after: next },
  };
};

/**
 * Implementation (single path):
 */
async function updatePath(
  path: t.StringPath,
  modify?: t.TmplLineUpdate,
): Promise<t.TmplFileUpdateResponse> {
  const withError = (err: string | t.StdError, args: Partial<t.TmplFileUpdateResponse> = {}) =>
    ({
      changed: false,
      changes: args.changes ?? [],
      before: args.before ?? '',
      after: args.after ?? '',
      error: Is.string(err) ? Err.std(err) : err,
    }) satisfies t.TmplFileUpdateResponse;

  /**
   * Pre-flight guard checks:
   */
  if (!(await Fs.exists(path))) return withError(`The given file path does not exist: ${path}`);
  if (!(await Fs.Is.file(path))) return withError(`The given path is not a file: ${path}`);

  const f = await Fs.readText(path);
  if (f.error) return withError(f.error);

  const res = Update.lines(f.data ?? '', !modify
    ? undefined
    : (line) =>
        modify({
          get file() {
            return {
              path,
              get lines() {
                return line.lines;
              },
            };
          },
          get text() {
            return line.text;
          },
          get index() {
            return line.index;
          },
          get is() {
            return line.is;
          },
          modify(next) {
            line.modify(next);
          },
          insert(text, position = 'before') {
            line.insert(text, position);
          },
          delete() {
            line.delete();
          },
        }));

  if (res.changed) await Fs.write(path, res.after, { force: true });
  return { ...res, changes: [...res.changes] };
}

/**
 * Helpers:
 */
const ensureEOF = (txt = '') => (txt.endsWith('\n') ? txt : `${txt}\n`);
