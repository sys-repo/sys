import { type t, Fs } from './common.ts';
import { copy } from './u.copy.ts';

/**
 * Create a new directory template.
 */
export const create: t.TmplFactory = (sourceDir, opt) => {
  const { processFile, beforeCopy, afterCopy } = wrangle.options(opt);
  return factory({ sourceDir, beforeCopy, processFile, afterCopy });
};

/**
 * Internal implementation of the template.
 */
function factory(args: {
  sourceDir: t.StringDir;
  beforeCopy?: t.TmplCopyHandler;
  processFile?: t.TmplProcessFile;
  afterCopy?: t.TmplCopyHandler;
  filter?: t.FsFileFilter[];
}): t.Tmpl {
  const { sourceDir, processFile } = args;
  const source = Fs.toDir(sourceDir, args.filter);
  const tmpl: t.Tmpl = {
    get source() {
      return source;
    },
    copy(target, options = {}) {
      const beforeCopy = wrangle.copyHandlers(args.beforeCopy, options.beforeCopy);
      const afterCopy = wrangle.copyHandlers(args.afterCopy, options.afterCopy);
      return copy(source, Fs.toDir(target), processFile, { ...options, beforeCopy, afterCopy });
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

  copyHandlers(base?: t.TmplCopyHandler, param?: t.TmplCopyHandler | t.TmplCopyHandler[]) {
    type T = t.TmplCopyHandler;
    return [param, base].flat(Infinity).filter(Boolean) as T[];
  },
} as const;
