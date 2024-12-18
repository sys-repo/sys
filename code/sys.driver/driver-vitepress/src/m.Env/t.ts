import type { t } from './common.ts';

/**
 * Tools for maintaining the local "Editor Machine/Device" environment state.
 */
export type VitePressEnvLib = {
  /** Initialize the local machine environment. */
  update(args?: t.VitePressEnvUpdateArgs): Promise<VitePressEnvUpdateResponse>;

  /** Create a new file-generator instances. */
  tmpl: VitePressTmplFactory;
};

/**
 * Creates an instance of the template file generator.
 */
export type VitePressTmplFactory = (args: t.VitePressTmplFactoryArgs) => t.Tmpl;
export type VitePressTmplFactoryArgs = {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
};

/** Arguments passed to the `VitePress.init` method. */
export type VitePressEnvUpdateArgs = {
  force?: boolean;
  inDir?: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
  silent?: boolean;
};

/**
 * The response returned from an update.
 */
export type VitePressEnvUpdateResponse = {
  readonly ops: t.TmplFileOperation[];
};
