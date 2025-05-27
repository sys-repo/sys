import { type t, Err, Fs, Is } from './common.ts';

export const update: t.TmplFileLib['update'] = async (path, modifier) => {
  type R = t.TmplFileUpdateResponse;
  const res: t.DeepMutable<R> = {
    get changed() {
      return res.changes.length > 0;
    },
    changes: [],
    before: '',
    after: '',
  };
  const withError = (err: string | t.StdError) => {
    res.error = Is.string(err) ? Err.std(err) : err;
    return res;
  };

  if (!(await Fs.exists(path))) return withError(`The given file path does not exist: ${path}`);
  if (!(await Fs.Is.file(path))) return withError(`The given path is not a file: ${path}`);

  const file = await Fs.readText(path);
  res.before = ensureEndCharReturn(file.data);
  if (file.error) return withError(file.error);

  if (typeof modifier === 'function') {
    const lines = res.before.split('\n');
    lines.pop(); // NB: do not pass the EOF for evaluation by the handler.
    for (const [index, text] of lines.entries()) {
      const payload: t.TmplFileUpdateArgs = {
        is: { first: index === 0, last: index === lines.length - 1 },
        line: { text, index },
        lines,
        modify(after) {
          if (after !== text) {
            res.changes.push({ line: { index }, before: text, after });
          }
        },
      };
      const returnValue = modifier(payload);
      if (Is.promise(returnValue)) await returnValue;
    }
  }

  if (!res.changed) {
    res.after = res.before;
  } else {
    const lines = res.before.split('\n');
    for (const change of res.changes) {
      lines[change.line.index] = change.after;
    }
    res.after = ensureEndCharReturn(lines.join('\n'));
    await Fs.write(path, res.after);
  }

  return res;
};

/**
 * Helpers:
 */
function ensureEndCharReturn(text: string = '') {
  if (!text.endsWith('\n')) text += '\n';
  return text;
}
