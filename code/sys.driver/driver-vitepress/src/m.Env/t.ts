import type { t } from './common.ts';

/**
 * Tools for maintaining the local "Editor Machine/Device" environment state.
 */
export type VitePressEnvLib = {
  /**
   * Initialize the local machine environment.
   */
  update(args?: t.VitePressEnvUpdateArgs): Promise<VitePressEnvUpdateResponse>;
};

/** Arguments passed to the `VitePress.init` method. */
export type VitePressEnvUpdateArgs = {
  force?: boolean;
  inDir?: t.StringDir;
  srcDir?: t.StringDir;
  upgrade?: t.StringSemver;
  silent?: boolean;
  filter?: (path: t.StringPath) => boolean;
};

/**
 * The response returned from an update.
 */
export type VitePressEnvUpdateResponse = {
  readonly files: t.VitePressFileUpdate[];
};

/**
 * Details about a file update.
 */
export type VitePressFileUpdate = {
  readonly kind: 'new' | 'unchanged' | 'updated';
  readonly path: t.StringPath;
};
