import { type t, Fs } from './common.ts';

type O = Record<string, unknown>;
type Changes = {
  excluded: t.TmplFileOperation['excluded'];
  filename: string;
  text: string;
};

export async function write(
  source: t.FsDir,
  target: t.FsDir,
  fn: t.TmplProcessFile | undefined,
  options: t.TmplWriteOptions = {},
) {
  const { ctx } = options;
  const forced = options.force ?? false;
  const ops: t.TmplFileOperation[] = [];
  const res: t.TmplWriteResponse = {
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

  const copyArgs: t.TmplWriteHandlerArgs = {
    ctx,
    get dir() {
      return { source, target };
    },
  };

  /**
   * Run BEFORE handlers.
   */
  for (const fn of wrangle.copyHandlers(options.onBefore)) {
    await fn(copyArgs);
  }

  /**
   * Perform copy on files.
   */
  for (const from of await source.ls()) {
    if (await Fs.Is.dir(from)) continue;

    const to = Fs.join(target.absolute, from.slice(source.absolute.length + 1));
    const isBinary = await Fs.Is.binary(to);
    const isText = !isBinary;

    const Lazy = {
      file() {
        let _prop: t.TmplFileOperation['file'];
        return () => {
          if (_prop) return _prop;
          return (_prop = {
            tmpl: Fs.toFile(from, source.absolute),
            target: Fs.toFile(to, target.absolute),
          });
        };
      },
      async text() {
        const sourceText = (await Fs.readText(from)).data ?? '';
        const targetText = (await Fs.readText(to)).data ?? '';
        let _prop: t.TmplFileOperation['text'];
        return () => {
          if (_prop) return _prop;
          return (_prop = {
            tmpl: sourceText,
            target: {
              before: targetText,
              after: targetText || sourceText,
              get isDiff() {
                return _prop?.target.before !== _prop?.target.after;
              },
            },
          });
        };
      },
    } as const;

    const fileProp = Lazy.file();
    const textProp = await Lazy.text();
    const op: t.TmplFileOperation = {
      contentType: (isText ? 'text' : 'binary') as any,
      get file() {
        return fileProp();
      },
      get text() {
        return isText ? textProp() : undefined;
      },
      get binary() {
        return null as any; // TEMP 🐷
      },
      excluded: false,
      written: false,
      created: false,
      updated: false,
      forced,
    };
    ops.push(op);

    if (typeof fn === 'function') {
      const { args, changes } = await wrangle.args(isText, op, ctx);
      await fn(args);

      if (changes.excluded) op.excluded = changes.excluded;
      if (changes.filename) op.file.target = wrangle.rename(op.file.target, changes.filename);
      if (isText) {
        if (changes.text) {
          op.text!.target.after = changes.text; // Update to modified output.
        } else {
          op.text!.target.after = args.text!.tmpl; // Update to current template.
        }
      } else {
      }
    }

    if (!op.excluded) {
      const target = op.file.target;
      const path = target.absolute;
      const exists = await Fs.exists(path);

      let isDiff = false;
      if (isText) isDiff = op.text!.target.isDiff;

      if (!exists) {
        op.created = true;
      } else if (isDiff || op.forced) {
        op.updated = true;
      }

      if ((op.created || op.updated) && !options.dryRun) {
        op.written = true;
        if (isText) await Fs.write(path, op.text!.target.after, { throw: true });
      }
    }
  }

  /**
   * Run AFTER handlers.
   */
  for (const fn of wrangle.copyHandlers(options.onAfter)) {
    await fn(copyArgs);
  }

  // Finish up.
  return res;
}

/**
 * Helpers
 */
const wrangle = {
  async args(isText: boolean, op: t.TmplFileOperation, ctx?: O) {
    const changes: Changes = { excluded: false, filename: '', text: '' };
    const { tmpl, target } = op.file;
    const exists = await Fs.exists(target.absolute);
    const args: t.TmplProcessFileArgs = {
      get ctx() {
        return ctx;
      },
      get tmpl() {
        return tmpl;
      },
      get target() {
        return { ...target, exists };
      },
      get text() {
        if (!isText) return undefined;
        return { tmpl: op.text!.tmpl, current: op.text!.target.before };
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

  copyHandlers(input?: t.TmplWriteHandler | t.TmplWriteHandler[]): t.TmplWriteHandler[] {
    if (!input) return [];
    const res = Array.isArray(input) ? input : [input];
    return res.flat(Infinity).filter(Boolean);
  },
} as const;
