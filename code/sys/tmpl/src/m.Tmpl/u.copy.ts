import { type t, Fs, toTmplFile } from './common.ts';

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

    const to = Fs.join(target.absolute, from.slice(source.absolute.length + 1));
    const sourceText = await Deno.readTextFile(from);
    const targetText = (await Fs.exists(to)) ? await Deno.readTextFile(to) : '';
    const op: t.TmplFileOperation = {
      file: {
        tmpl: toTmplFile(source.absolute, from),
        target: toTmplFile(target.absolute, to),
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
      if (changes.filename) op.file.target = wrangle.rename(op.file.target, changes.filename);
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
    const { tmpl, target } = op.file;
    const args: t.TmplProcessFileArgs = {
      tmpl,
      target: { ...target, exists: await Fs.exists(target.absolute) },
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

  rename(input: t.TmplFile, newFilename: string): t.TmplFile {
    return toTmplFile(input.base, Fs.join(input.dir, newFilename));
  },
} as const;
