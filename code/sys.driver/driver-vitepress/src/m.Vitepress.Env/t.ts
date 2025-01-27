import type { t } from './common.ts';

/**
 * Tools for maintaining the local "Editor Machine/Device" environment state.
 */
export type VitepressEnvLib = {
  /** Template library for a VitePress project. */
  readonly Tmpl: t.VitepressTmplLib;

  /** Initialize the local machine environment with latest templates */
  update(args?: t.VitepressEnvUpdateArgs): Promise<t.VitepressEnvUpdateResponse>;

  /** Create a backup snapshot. */
  backup(args: t.VitepressBackupArgs): Promise<t.VitepressBackupResponse>;
};

/** Arguments passed to the `VitePress.Env.update` method. */
export type VitepressEnvUpdateArgs = {
  force?: boolean;
  inDir?: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
  silent?: boolean;
};

/**
 * The response returned from an environment update.
 */
export type VitepressEnvUpdateResponse = {
  readonly ops: t.TmplFileOperation[];
};

/** Arguments passed to the `VitePress.Env.backup` method. */
export type VitepressBackupArgs = {
  inDir: t.StringDir;
  silent?: boolean;
  includeDist?: boolean;
  force?: boolean;
  message?: string;
};
export type VitepressBackupResponse = {
  readonly snapshot: t.DirSnapshot;
};
