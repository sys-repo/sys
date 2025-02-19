import { type t, PATHS } from './common.ts';

export const paths: t.ViteConfigLib['paths'] = (options = {}) => {
  const app: t.DeepMutable<t.ViteConfigPathApp> = { input: PATHS.html.index, outDir: PATHS.dist };
  const lib: t.DeepMutable<t.ViteConfigPathLib> = {};

  if (valueExists(options.app?.input)) app.input = options.app?.input;
  if (valueExists(options.app?.outDir)) app.outDir = options.app?.outDir;

  app.input = app.input.trim();
  app.outDir = app.outDir.trim();

  return { app, lib };
};

/**
 * Helpers
 */
function valueExists(value?: string): value is string {
  return typeof value === 'string' ? !!value.trim() : false;
}
