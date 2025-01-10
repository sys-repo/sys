import type { t } from './common.ts';

/**
 * Tools for maintaining the local "Editor Machine/Device" environment state.
 */
export type VitePressEnvLib = {
  /** Create a new file-generator instances. */
  tmpl: VitePressTmplFactory;

  /** Initialize the local machine environment with latest templates */
  update(args?: t.VitePressEnvUpdateArgs): Promise<t.VitePressEnvUpdateResponse>;

  /** Create a backup snapshot. */
  backup(args: t.VitePressBackupArgs): Promise<t.VitePressBackupResponse>;
};

/**
 * Creates an instance of the template file generator.
 */
export type VitePressTmplFactory = (args: t.VitePressTmplFactoryArgs) => Promise<t.Tmpl>;
export type VitePressTmplFactoryArgs = {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
};

/** Arguments passed to the `VitePress.Env.update` method. */
export type VitePressEnvUpdateArgs = {
  force?: boolean;
  inDir?: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
  silent?: boolean;
};

/**
 * The response returned from an environment update.
 */
export type VitePressEnvUpdateResponse = {
  readonly ops: t.TmplFileOperation[];
};

/** Arguments passed to the `VitePress.Env.backup` method. */
export type VitePressBackupArgs = {
  inDir: t.StringDir;
  silent?: boolean;
  includeDist?: boolean;
  force?: boolean;
  message?: string;
};
export type VitePressBackupResponse = {
  readonly snapshot: t.DirSnapshot;
};
