import type { t } from './common.ts';

/**
 * Tools for working with a Deno module/app, namely something that
 * has a `deno.json` file and can be `upgraded` against a registry.
 */
export type DenoModuleLib = {
  /**
   * Perform an upgrade to the latest version of the module in the registry.
   * Relies on the module exposing a "/init" ESM entry point, eg:
   */
  upgrade(args: DenoModuleUpgradeArgs): Promise<DenoModuleUpgrade>;
};

/** Arguments for the `DenoModule.upgrade` method. */
export type DenoModuleUpgradeArgs = {
  /** The package name. */
  name: t.StringPkgName;

  /** The current version of the package. */
  currentVersion: t.StringSemver;

  /** The tarvet version to upgrade to (ommit to use latest in registry). */
  targetVersion?: t.StringSemver;

  /** The root directory of the project to upgrade. */
  dir?: t.StringDir;

  /** Flag indicating if the upgrade should be forced, even if already at latest version. */
  force?: boolean;

  /** If `true`, the upgrade is performed as a "dry run," meaning no actual changes are made to the project. */
  dryRun?: boolean;

  /**
   * A hook that is called if an upgrade is needed immediately before the
   * operation begins, allowing for other safety/migration
   * steps to be performed.
   */
  beforeUpgrade?: (e: { message: string }) => Promise<void>;
};

/** Response from `DenoModule.upgrade` method. */
export type DenoModuleUpgrade = {
  readonly version: { from: t.StringSemver; to: t.StringSemver };
  readonly changed: boolean;
  readonly dryRun: boolean;
};
