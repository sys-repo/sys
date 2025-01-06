import { type t, toDir } from './common.ts';
import { copy } from './u.copy.ts';

/**
 * Create a new directory template.
 */
export const create: t.TmplFactory = (sourceDir, fn) => {
  return factory({ sourceDir, fn });
};

/**
 * Internal implementation of the template.
 */
function factory(args: {
  sourceDir: t.StringDir;
  fn?: t.TmplProcessFile;
  filter?: t.TmplFilter[];
}): t.Tmpl {
  const { sourceDir, fn } = args;
  const source = toDir(sourceDir, args.filter);
  const tmpl: t.Tmpl = {
    get source() {
      return source;
    },
    copy(target, options = {}) {
      return copy(source, toDir(target), fn, options);
    },
    filter(next) {
      const { sourceDir, fn } = args;
      const filter = [...(args.filter ?? []), next];
      return factory({ sourceDir, fn, filter });
    },
  };
  return tmpl;
}
