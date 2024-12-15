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
    ops: [],
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
      excluded: false,
      written: false,
      created: false,
      updated: false,
    };

    if (typeof fn === 'function') {
      const { args, changes } = wrangle.args(op);
      const res = fn(args);
      if (Is.promise(res)) await res;
      if (changes.excluded) op.excluded = changes.excluded;
      if (changes.filename) op.file.target = Wrangle.rename(op.file.target, changes.filename);
      if (changes.text) op.text.target.after = changes.text;
    }

    if (!op.excluded) {
      const target = op.file.target;
      const path = target.path;
      const exists = await Fs.exists(path);
      const isDiff = op.text.target.before !== op.text.target.after;
      if (!exists) {
        op.written = true;
        op.created = true;
      } else if (isDiff) {
        op.written = true;
        op.updated = true;
      }
      if (op.created || op.updated) {
        await Fs.ensureDir(target.dir);
        await Deno.writeTextFile(path, op.text.target.after);
      }
    }

    // Log final state.
    res.ops.push(op);
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
