import { type t, Fs, Is, toTmplFile2 } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';

type Changes = {
  excluded: t.TmplFileOperation['excluded'];
  filename: string;
  text: string;
};

export async function copy(
  source: t.TmplDir,
  target: t.TmplDir,
  fn: t.TmplProcessFile | undefined,
  options: t.TmplCopyOptions = {},
) {
  const forced = options.force ?? false;
  const res: t.TmplCopyResponse = { source, target, ops: [] };

  for (const from of await source.ls()) {
    if (await Fs.Is.dir(from)) continue;

    const to = Fs.join(target.path, from.slice(source.path.length + 1));
    const sourceText = await Deno.readTextFile(from);
    const targetText = (await Fs.exists(to)) ? await Deno.readTextFile(to) : '';
    const op: t.TmplFileOperation = {
      file: {
        tmpl: toTmplFile2(source.path, from),
        target: toTmplFile2(target.path, to),
      },
      text: {
        tmpl: sourceText,
        target: {
          before: targetText,
          after: targetText || sourceText,
          get isDiff() {
            return op.text.target.before !== op.text.target.after;
          },
        },
      },
      excluded: false,
      written: false,
      created: false,
      updated: false,
      forced,
    };
    res.ops.push(op);

    if (typeof fn === 'function') {
      const { args, changes } = await wrangle.args(op);
      await fn(args);
      if (changes.excluded) op.excluded = changes.excluded;
      if (changes.filename) op.file.target = Wrangle.rename(op.file.target, changes.filename);
      if (changes.text) {
        op.text.target.after = changes.text; // Update to modified output.
      } else {
        op.text.target.after = args.text.tmpl; // Update to current template.
      }
    }

    if (!op.excluded) {
      const target = op.file.target;
      const path = target.absolute;
      const exists = await Fs.exists(path);
      const isDiff = op.text.target.isDiff;

      if (!exists) {
        op.created = true;
      } else if (isDiff || op.forced) {
        op.updated = true;
      }

      if ((op.created || op.updated) && (options.write ?? true)) {
        op.written = true;

        await Fs.ensureDir(Fs.dirname(path));
        await Deno.writeTextFile(path, op.text.target.after);
      }
    }
  }

  return res;
}

/**
 * Helpers
 */
const wrangle = {
  async args(op: t.TmplFileOperation) {
    const changes: Changes = { excluded: false, filename: '', text: '' };
    const args: t.TmplProcessFileArgs = {
      file: await wrangle.argsFile(op.file),
      text: { tmpl: op.text.tmpl, current: op.text.target.before },
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

  async argsFile(file: t.TmplFileOperation['file']) {
    const exists = await Fs.exists(file.target.absolute);
    const target = { ...file.target, exists };
    const res: t.TmplProcessFileArgs['file'] = { ...file, target };
    return res;
  },
} as const;
