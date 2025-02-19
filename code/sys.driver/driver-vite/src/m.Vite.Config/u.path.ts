import { type t, PATHS, Path } from './common.ts';

type F = t.ViteConfigLib['paths'];

export const paths: F = (options = {}) => {
  const cwd = wrangle.cwd(options);
  const app: t.DeepMutable<t.ViteConfigPathsApp> = {
    entry: PATHS.html.index,
    outDir: PATHS.dist,
    base: './',
  };
  const lib: t.DeepMutable<t.ViteConfigPathsLib> = {};

  if (valueExists(options.app?.entry)) app.entry = options.app?.entry;
  if (valueExists(options.app?.outDir)) app.outDir = options.app?.outDir;
  if (valueExists(options.app?.base)) app.base = options.app?.base;

  app.entry = app.entry.trim();
  app.outDir = app.outDir.trim();
  app.base = app.base.trim();

  return { cwd, app, lib };
};

/**
 * Helpers
 */
function valueExists(value?: string): value is string {
  return typeof value === 'string' ? !!value.trim() : false;
}

/**
 * Helpers
 */
const wrangle = {
  cwd(options: Parameters<F>[0]) {
    if (typeof options?.cwd !== 'string') return Path.cwd();
    let path = options.cwd.trim();
    if (path.startsWith('file://')) path = Path.dirname(Path.fromFileUrl(path));
    return path;
  },
} as const;
