import { type t, Fs, Is, Path } from './common.ts';

export const Tmpl: t.TmplLib = {
  create(source, fn) {
    const api: t.Tmpl = {
      source: wrangle.dir(source),

      async copy(target) {
        const res: t.TmplCopyResponse = {
          source: api.source,
          target: wrangle.dir(target),
          operations: [],
        };

        for (const from of await api.source.ls()) {
          if (!(await Fs.Is.file(from))) continue;

          const to = Fs.join(target, from.slice(source.length + 1));
          const file = wrangle.file(to);
          const operation: t.DeepPartial<t.TmplFileOperation> = { file, kind: 'Unchanged' };

          if (typeof fn === 'function') {
            const { args, changes } = wrangle.args(file);
            const res = fn(args);
            if (Is.promise(res)) await res;
            if (changes.excluded) operation.excluded = changes.excluded;
          }

          await Fs.copy(from, to);

          res.operations.push(operation as t.TmplFileOperation);
        }

        return res;
      },
    };

    return api;
  },
};

/**
 * Helpers
 */
const wrangle = {
  dir(dir: string): t.TmplDir {
    return {
      dir,
      async ls() {
        const files = await Fs.glob(dir).find('**');
        return files.filter((p) => p.path !== dir).map((p) => p.path);
      },
    };
  },

  file(path: t.StringPath): t.TmplFile {
    const cwd = Path.cwd();
    const dir = Path.trimCwd(Path.dirname(path));
    const name = Path.trimCwd(Path.basename(path));
    return { cwd, path, dir, name };
  },

  args(file: t.TmplFile) {
    const changes = {
      excluded: '',
    };

    const args: t.TmplProcessFileArgs = {
      file,
      exclude(reason) {
        changes.excluded = reason;
        return args;
      },
      change: {
        filename(text) {
          return args;
        },
        body(text) {
          return args;
        },
      },
    };

    return { args, changes } as const;
  },
} as const;
