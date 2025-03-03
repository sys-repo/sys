import { type t, Fs } from './common.ts';
import { write } from './u.write.ts';

/**
 * Create a new directory template.
 */
export const create: t.TmplFactory = (sourceDir, opt) => {
  const { processFile, beforeWrite, afterWrite } = wrangle.options(opt);
  return factory({ sourceDir, beforeWrite, processFile, afterWrite });
};

/**
 * Internal implementation of the template.
 */
function factory(args: {
  sourceDir: t.StringDir;
  beforeWrite?: t.TmplWriteHandler;
  processFile?: t.TmplProcessFile;
  afterWrite?: t.TmplWriteHandler;
  filter?: t.FsFileFilter[];
}): t.Tmpl {
  const { sourceDir, processFile } = args;
  const source = Fs.toDir(sourceDir, args.filter);
  const tmpl: t.Tmpl = {
    get source() {
      return source;
    },
    write(target, options = {}) {
      const onBefore = wrangle.writeHandlers(args.beforeWrite, options.onBefore);
      const onAfter = wrangle.writeHandlers(args.afterWrite, options.onAfter);
      return write(source, Fs.toDir(target), processFile, { ...options, onBefore, onAfter });
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

  writeHandlers(base?: t.TmplWriteHandler, param?: t.TmplWriteHandler | t.TmplWriteHandler[]) {
    type T = t.TmplWriteHandler;
    return [param, base].flat(Infinity).filter(Boolean) as T[];
  },
} as const;
