import type { t } from './common.ts';

/**
 * Tools for maintaining the local "Editor Machine/Device" environment state.
 */
export type VitepressEnvLib = {
  /** Template library for a VitePress project. */
  readonly Tmpl: t.VitepressTmplLib;

  /** Create a backup snapshot. */
  backup(args: t.VitepressBackupArgs): Promise<t.VitepressBackupResponse>;
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
