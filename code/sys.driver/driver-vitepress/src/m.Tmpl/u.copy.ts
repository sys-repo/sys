import { type t, Fs, Is } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';

type Changes = {
  excluded: t.TmplFileOperation['excluded'];
  filename: string;
  text: string;
};

export async function copy(source: t.TmplDir, target: t.TmplDir, fn?: t.TmplProcessFile) {
  const res: t.TmplCopyResponse = {
    source,
    target,
    operations: [],
  };

  for (const from of await source.ls()) {
    if (await Fs.Is.dir(from)) continue;

    const to = Fs.join(target.dir, from.slice(source.dir.length + 1));
    const sourceText = await Deno.readTextFile(from);
    const targetText = (await Fs.exists(to)) ? await Deno.readTextFile(to) : '';
    const op: t.TmplFileOperation = {
      file: {
        source: Wrangle.file(from),
        target: Wrangle.file(to),
      },
      text: {
        source: sourceText,
        target: { before: targetText, after: targetText || sourceText },
      },
      exists: await Fs.exists(to),
      excluded: false,
    };

    if (typeof fn === 'function') {
      const { args, changes } = wrangle.args(op);
      const res = fn(args);
      if (Is.promise(res)) await res;
      if (changes.excluded) op.excluded = changes.excluded;
      if (changes.filename) op.file.target.name = changes.filename;
      if (changes.text) op.text.target.after = changes.text;
    }

    /**
     * TODO 🐷
     * - MOVE [Tmpl] → @sys/tmpl
     * - update action
     * - only write when necessary.
     * - calculate diff
     */
    if (typeof op.excluded !== 'string') {
    if (!op.excluded) {
      await Fs.ensureDir(op.file.target.dir);
      await Deno.writeTextFile(op.file.target.path, op.text.target.after);
    }

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
    const changes: Changes = { excluded: false, filename: '', text: '' };
    const text = op.text.target.before || op.text.source;
    const args: t.TmplProcessFileArgs = {
      file: op.file,
      text,
      exclude(reason) {
        changes.excluded = typeof reason === 'string' ? { reason } : true;
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
