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
    const op: t.TmplFileOperation = {
      source: Wrangle.file(from),
      target: Wrangle.file(to),
      text: { before: text, after: text },
      action: 'Unchanged',
      exists: await Fs.exists(to),
    };

    if (typeof fn === 'function') {
      // const { args, changes } = wrangle.args(op.target, op.text.before);
      const { args, changes } = wrangle.args(op);
      const res = fn(args);
      if (Is.promise(res)) await res;
      if (changes.excluded) op.excluded = changes.excluded;
      if (changes.filename) op.target.name = changes.filename;
      if (changes.text) op.text.after = changes.text;
    }

    /**
     * TODO 🐷
     * - MOVE [Tmpl] → @sys/tmpl
     * - update action
     * - only write when necessary.
     * - calculate diff
     */
    await Fs.ensureDir(op.target.dir);
    await Deno.writeTextFile(op.target.path, op.text.after);

    // Log final state.
    res.operations.push(op);
  }

  return res;
}

/**
 * Helpers
 */
const wrangle = {
  args(op: t.TmplFileOperation) {
    // const { args, changes } = wrangle.args(op.target, op.text.before);

    const changes = { excluded: '', filename: '', text: '' };

    const text = op.text.before;

    const args: t.TmplProcessFileArgs = {
      file: {
        source: op.source,
        target: op.target,
      },
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
