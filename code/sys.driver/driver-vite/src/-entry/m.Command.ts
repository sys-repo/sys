import { build, load as loadBuild } from './u.load.build.ts';
import { dev, load as loadDev } from './u.load.dev.ts';
import { load as loadInfo } from './u.load.info.ts';
import { load as loadServe, serve } from './u.load.serve.ts';

/**
 * The single production command-to-loader association.
 */
export const COMMAND_LOADERS = Object.freeze({
  build: loadBuild,
  dev: loadDev,
  info: loadInfo,
  serve: loadServe,
});

export { build, dev, serve };
