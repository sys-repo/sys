import type { t } from './common.ts';

/**
 * Tools for working with a Deno module/app, namely something that
 * has a `deno.json` file and can be `upgraded` against a registry.
 */
export type DenoModuleLib = {
  /**
   * Perform an upgrade to the latest version of the module in the registry.
   * Relies on the module exposing a "/init" ESM entry point, eg:
   *
   *    deno run -A jsr:@sys/driver-vite/init
   */
  upgrade(args: t.DenoModuleUpgradeArgs): Promise<DenoModuleUpgradeResponse>;

  /**
   * Create a backup snapshot of the module's source-code and working files.
   */
  backup(args: t.DenoModuleBackupArgs): Promise<t.DenoModuleBackupResponse>;
};

/** Arguments for the `DenoModule.upgrade` method. */
export type DenoModuleUpgradeArgs = {
  name: t.StringPkgName;
  currentVersion: t.StringSemver;
  targetVersion?: t.StringSemver;
  dir?: t.StringDir;
  force?: boolean;
  dryRun?: boolean;
};

/** Resposne from `DenoModule.upgrade` method. */
export type DenoModuleUpgradeResponse = {
  readonly version: { from: t.StringSemver; to: t.StringSemver };
  readonly changed: boolean;
};

/** Arguments for the `DenoModule.backup` method. */
export type DenoModuleBackupArgs = {
  /** The source directory to backup (default: "./"). */
  source?: t.StringDir;

  /** The target directory to backup to (default: "./-backup/"). */
  target?: t.StringDir;

  /** Include the `/dist` output if present. */
  includeDist?: boolean;

  /** Force the snapshot even if an existing shaoshot hash exists (default: false). */
  force?: boolean;

  /** Supress console output (default: false). */
  silent?: boolean;

  /** Formatting properties (relevant only when not `silent`). */
  fmt?: { title?: string };

  /** Augment the snapshot meta with a "commit" style messagae. */
  message?: string;

  /** Ignore pattern (.gitignore style). */
  ignore?: string;

  /** Filter function to narrow down the paths included in the snapshot. */
  filter?: t.FsPathFilter;
};
/** Response from `VitePress.Env.backup` method. */
export type DenoModuleBackupResponse = { readonly snapshot: t.DirSnapshot };
