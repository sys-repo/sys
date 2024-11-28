import type { t } from './common.ts';

/**
 * Tools for maintaining the local "Editor Machine/Device" environment state.
 */
export type VitePressEnvLib = {
  /**
   * Initialize the local machine environment.
   */
  init(args?: t.VitePressEnvInitArgs): Promise<void>;
};

/** Arguments passed to the `VitePress.init` method. */
export type VitePressEnvInitArgs = {
  force?: boolean;
  inDir?: t.StringDir;
  srcDir?: t.StringDir;
  upgrade?: t.StringSemver;
  silent?: boolean;
  filter?: (path: t.StringPath) => boolean;
};
