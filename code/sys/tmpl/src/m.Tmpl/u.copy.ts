import { type t, Fs } from './common.ts';

type Changes = {
  excluded: t.TmplFileOperation['excluded'];
  filename: string;
  text: string;
};

export async function copy(
  source: t.FsDir,
  target: t.FsDir,
  fn: t.TmplProcessFile | undefined,
  options: t.TmplCopyOptions = {},
) {
  const forced = options.force ?? false;
  const ops: t.TmplFileOperation[] = [];
  const res: t.TmplCopyResponse = {
    get source() {
      return source;
    },
    get target() {
      return target;
    },
    get ops() {
      return ops;
    },
  };

  const copyArgs: t.TmplCopyHandlerArgs = {
    get dir() {
      return { source, target };
    },
  };

  /**
   * Run BEFORE handlers.
   */
  for (const fn of wrangle.copyHandlers(options.beforeCopy)) {
    await fn(copyArgs);
  }

  /**
   * Perform copy on files.
   */
  for (const from of await source.ls()) {
    if (await Fs.Is.dir(from)) continue;

    const to = Fs.join(target.absolute, from.slice(source.absolute.length + 1));
    const sourceText = (await Fs.readText(from)).data ?? '';
    const targetText = (await Fs.readText(to)).data ?? '';

    type T = t.TmplFileOperation;
    let _file: T['file'];
    let _text: T['text'];

    const op: T = {
      get file() {
        if (_file) return _file;
        return (_file = {
          tmpl: Fs.toFile(from, source.absolute),
          target: Fs.toFile(to, target.absolute),
        });
      },
      get text() {
        if (_text) return _text;
        return (_text = {
          tmpl: sourceText,
          target: {
            before: targetText,
            after: targetText || sourceText,
            get isDiff() {
              return op.text.target.before !== op.text.target.after;
            },
          },
        });
      },
      excluded: false,
      written: false,
      created: false,
      updated: false,
      forced,
    };
    ops.push(op);

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

  /**
   * Run AFTER handlers.
   */
  for (const fn of wrangle.copyHandlers(options.afterCopy)) {
    await fn(copyArgs);
  }

  // Finish up.
  return res;
}

/**
 * Helpers
 */
const wrangle = {
  async args(op: t.TmplFileOperation) {
    const changes: Changes = { excluded: false, filename: '', text: '' };
    const { tmpl, target } = op.file;
    const exists = await Fs.exists(target.absolute);
    const args: t.TmplProcessFileArgs = {
      get tmpl() {
        return tmpl;
      },
      get target() {
        return { ...target, exists };
      },
      get text() {
        return { tmpl: op.text.tmpl, current: op.text.target.before };
      },
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

  rename(input: t.FsFile, newFilename: string): t.FsFile {
    return Fs.toFile(Fs.join(input.dir, newFilename), input.base);
  },

  copyHandlers(input?: t.TmplCopyHandler | t.TmplCopyHandler[]): t.TmplCopyHandler[] {
    if (!input) return [];
    const res = Array.isArray(input) ? input : [input];
    return res.flat(Infinity).filter(Boolean);
  },
} as const;
