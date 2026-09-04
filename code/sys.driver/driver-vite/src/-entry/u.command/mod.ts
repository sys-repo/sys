import type { t } from '../common.ts';
import { load as loadBuild } from './u.load/u.build.ts';
import { load as loadDev } from './u.load/u.dev.ts';
import { load as loadInfo } from './u.load/u.info.ts';
import { load as loadServe } from './u.load/u.serve.ts';

/**
 * The exact production command-to-loader association.
 *
 * Each loader owns the sole literal dynamic-import boundary into one selected
 * command module; that module owns both API invocation and CLI dispatch.
 */
export const COMMAND_LOADERS = Object.freeze({
  build: loadBuild,
  dev: loadDev,
  info: loadInfo,
  serve: loadServe,
});

/**
 * Build through the fixed production command loader.
 *
 * Resolves only the selected build command graph.
 */
export const build: t.ViteEntry.Lib['build'] = async (args) => {
  await (await loadBuild()).build(args);
};

/**
 * Start development through the fixed production command loader.
 *
 * Resolves only the selected development command graph.
 */
export const dev: t.ViteEntry.Lib['dev'] = async (args) => {
  await (await loadDev()).dev(args);
};

/**
 * Serve through the fixed production command loader.
 *
 * Resolves only the selected verified-Dist command graph.
 */
export const serve: t.ViteEntry.Lib['serve'] = async (args) => {
  await (await loadServe()).serve(args);
};
