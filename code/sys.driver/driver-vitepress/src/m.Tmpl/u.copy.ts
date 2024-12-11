import { type t, Fs, Is } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';

export async function copy(source: t.TmplDir, target: t.TmplDir, fn?: t.TmplProcessFile) {
  const res: t.TmplCopyResponse = {
    source,
    target,
    operations: [],
  };

  for (const from of await source.ls()) {
    if (await Fs.Is.dir(from)) continue;

    const to = Fs.join(target.dir, from.slice(source.dir.length + 1));
    const text = await Deno.readTextFile(from);
    const op: t.TmplOperation = {
      source: Wrangle.file(from),
      target: Wrangle.file(to),
      text: { from: text, to: text },
      action: 'Unchanged',
    };

    if (typeof fn === 'function') {
      const { args, changes } = wrangle.args(op.target, op.text.from);
      const res = fn(args);
      if (Is.promise(res)) await res;
      if (changes.excluded) op.excluded = changes.excluded;
      if (changes.filename) op.target.name = changes.filename;
      if (changes.text) op.text.to = changes.text;
    }

    await Fs.ensureDir(op.target.dir);
    await Deno.writeTextFile(op.target.path, op.text.to);

    // Log final state.
    res.operations.push(op);
  }

  return res;
}

/**
 * Helpers
 */
const wrangle = {
  args(file: t.TmplFile, text: string) {
    const changes = { excluded: '', filename: '', text: '' };
    const args: t.TmplProcessFileArgs = {
      file,
      text,
      exclude(reason) {
        changes.excluded = reason;
        return args;
      },
      rename(filename) {
        changes.filename = filename;
        return args;
      },
      modify(text) {
        changes.text = text;
        return args;
      },
    };
    return { args, changes } as const;
  },
} as const;
