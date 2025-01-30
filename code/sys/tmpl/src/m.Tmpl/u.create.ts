import { type t, Fs } from './common.ts';
import { copy } from './u.copy.ts';

/**
 * Create a new directory template.
 */
export const create: t.TmplFactory = (sourceDir, opt) => {
  const { processFile } = wrangle.options(opt);
  return factory({ sourceDir, processFile });
};

/**
 * Internal implementation of the template.
 */
function factory(args: {
  sourceDir: t.StringDir;
  processFile?: t.TmplProcessFile;
  filter?: t.FsFileFilter[];
}): t.Tmpl {
  const { sourceDir, processFile } = args;
  const source = Fs.toDir(sourceDir, args.filter);
  const tmpl: t.Tmpl = {
    get source() {
      return source;
    },
    copy(target, options = {}) {
      return copy(source, Fs.toDir(target), processFile, options);
    },
    filter(next) {
      const { sourceDir, processFile } = args;
      const filter = [...(args.filter ?? []), next];
      return factory({ sourceDir, processFile, filter });
    },
  };
  return tmpl;
}

/**
 * Helpers
 */
const wrangle = {
  options(input: Parameters<t.TmplFactory>[1]): t.TmplFactoryOptions {
    if (!input) return {};
    if (typeof input === 'function') return { processFile: input };
    return input;
  },
} as const;
