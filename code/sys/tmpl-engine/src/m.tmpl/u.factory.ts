import { type t, FileMap, Is, isRecord } from './common.ts';

type O = Record<string, unknown>;

/**
 * Create a new directory template.
 */
export const makeTmpl: t.TmplFactory = (source, opt) => {
  const options = wrangle.options(opt);
  const { processFile, ctx } = options;
  return factory({ source, ctx, processFile });
};

/**
 * Internal implementation of the template.
 */
function factory(args: {
  source: t.StringDir | t.FileMap;
  processFile?: t.TmplProcessFile;
  filters?: t.FileMapFilter[];
  ctx?: O;
}): t.Tmpl {
  const { filters } = args;

  let _fileMap: t.FileMap | undefined = Is.object(args.source) ? args.source : undefined;
  async function lazySource() {
    const dir = (Is.string(args.source) ? args.source : '').trim();
    if (!_fileMap) _fileMap = dir ? await FileMap.toMap(dir) : {};
    for (const fn of filters ?? []) _fileMap = FileMap.filter(_fileMap, fn);

    const api: t.TmplContent = {
      dir,
      get fileMap() {
        return _fileMap!;
      },
      get files() {
        return Object.keys(api.fileMap);
      },
    };
    return api;
  }

  /**
   * API:
   */
  const tmpl: t.Tmpl = {
    source: lazySource,

    async write(target, options = {}) {
      const { force, dryRun } = options;
      const ctx = wrangle.ctx(args.ctx, options.ctx);
      const source = await tmpl.source();

      const processFile: t.FileMapProcessor = (e) => args.processFile?.(e); // ← NB: forward as-is (keeps e.ctx)
      const res = await FileMap.write(source.fileMap, target, { ctx, processFile, force, dryRun });

      // prettier-ignore
      return {
        ctx,
        get dir() { return { source: source.dir, target }; },
        get ops() { return res.ops; },
      };
    },

    filter(next) {
      const { source, processFile, ctx } = args;
      const filters = [...(args.filters ?? []), next];
      return factory({ source, ctx, processFile, filters });
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

  ctx(root?: O, write?: O): O | undefined {
    return isRecord(root) || isRecord(write) ? { ...root, ...write } : undefined;
  },
} as const;
