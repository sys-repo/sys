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
   *
   */
  upgrade(args: t.DenoModuleUpgradeArgs): Promise<DenoModuleUpgradeResponse>;
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
