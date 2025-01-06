import { type t, Fs, Path, toTmplFile___, toTmplFile2 } from './common.ts';


/**
 * Helpers
 */
export const Wrangle = {
  dir(dir: t.StringDir, filters?: t.TmplFilter[]): t.TmplDir {
    const path = Path.resolve(dir);
    return {
      path,
      join: (...parts) => Path.join(path, ...parts),
      async ls(trimCwd) {
        const files = await Fs.glob(dir, { includeDirs: false }).find('**');
        const include = (p: string) => {
          if (!filters) return true;
          const file = toTmplFile2(path, p);
          return filters.every((filter) => filter(file));
        };
        return files
          .filter((p) => include(p.path))
          .map((p) => (trimCwd ? Path.trimCwd(p.path) : p.path));
      },
    };
  },

  rename(input: t.TmplFile2, newFilename: string): t.TmplFile2 {
    return toTmplFile2(input.base, Fs.join(input.dir, newFilename));
  },
} as const;
