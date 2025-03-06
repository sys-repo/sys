import { type t, Fs } from './common.ts';
import { createArgs } from './u.write.args.ts';

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
    const isBinary = await Fs.Is.binary(from);
    const isText = !isBinary;
    const to = Fs.join(target.absolute, from.slice(source.absolute.length + 1));

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
        type R = t.TmplTextFileOperation['text'];
        const source = isText ? (await Fs.readText(from)).data ?? '' : '';
        const target = isText ? (await Fs.readText(to)).data ?? '' : '';
        let _prop: R;
        return (): R => {
          if (_prop) return _prop;
          return (_prop = {
            tmpl: source,
            target: {
              before: target,
              after: target || source,
              get isDiff() {
                return _prop?.target.before !== _prop?.target.after;
              },
            },
          });
        };
      },
      async binary() {
        type R = t.TmplBinaryFileOperation['binary'];
        const empty = new Uint8Array(0);
        const source = isBinary ? (await Fs.read(from)).data ?? empty : empty;
        const target = isBinary ? (await Fs.read(to)).data ?? empty : empty;
        let _prop: R;
        return (): R => {
          if (_prop) return _prop;
          return (_prop = {
            tmpl: source,
            target: {
              before: target,
              after: target || source,
              get isDiff() {
                return !arraysEqual(_prop?.target.before, _prop?.target.after);
              },
            },
          });
        };
      },
    } as const;

    const fileProp = Lazy.file();
    const textProp = await Lazy.text();
    const binaryProp = await Lazy.binary();

    const op: t.TmplFileOperation = {
      contentType: (isText ? 'text' : 'binary') as any,
      get file() {
        return fileProp();
      },
      get text() {
        return (isText ? textProp() : undefined) as any; // NB: type-hack.
      },
      get binary() {
        return (isBinary ? binaryProp() : undefined) as any; // NB: type-hack.
      },
      excluded: false,
      written: false,
      created: false,
      updated: false,
      forced,
    };
    ops.push(op);

    /**
     * Run "process file" handler.
     */
    const { args, changes } = await createArgs(op, ctx);
    if (typeof fn === 'function') {
      await fn(args);

      if (changes.excluded) op.excluded = changes.excluded;
      if (changes.filename) op.file.target = wrangle.rename(op.file.target, changes.filename);
      if (isText) {
        if (changes.text) {
          op.text!.target.after = changes.text; // Update to: modified output.
        } else {
          op.text!.target.after = args.text!.tmpl; // Update to: current template.
        }
      }
      if (isBinary) {
        if (changes.binary) {
          op.binary!.target.after = changes.binary; // Update to: modified output.
        } else {
          op.binary!.target.after = args.binary!.tmpl; // Update to: current template.
        }
      }
    } else {
      if (isText) op.text!.target.after = args.text!.tmpl; // Update to: current template.
      if (isBinary) op.binary!.target.after = args.binary!.tmpl; // Update to: current template.
    }

    if (!op.excluded) {
      const target = op.file.target;
      const path = target.absolute;
      const exists = await Fs.exists(path);

      let isDiff = false;
      if (isText) isDiff = op.text!.target.isDiff;
      if (isBinary) isDiff = op.binary!.target.isDiff;

      if (!exists) {
        op.created = true;
      } else if (isDiff || op.forced) {
        op.updated = true;
      }

      if ((op.created || op.updated) && !options.dryRun) {
        let data: string | Uint8Array | undefined;
        if (isText) data = op.text!.target.after;
        if (isBinary) data = op.binary!.target.after;
        if (data) {
          op.written = true;
          await Fs.write(path, data, { throw: true });
        }
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
  rename(input: t.FsFile, newFilename: string): t.FsFile {
    return Fs.toFile(Fs.join(input.dir, newFilename), input.base);
  },

  copyHandlers(input?: t.TmplWriteHandler | t.TmplWriteHandler[]): t.TmplWriteHandler[] {
    if (!input) return [];
    const res = Array.isArray(input) ? input : [input];
    return res.flat(Infinity).filter(Boolean);
  },
} as const;

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
