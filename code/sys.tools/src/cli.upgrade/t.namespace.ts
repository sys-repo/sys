import type { t } from './common.ts';

/**
 * The `@sys/tools/upgrade` namespace.
 */
export namespace UpgradeTool {
  export const ID = 'upgrade' as const;
  export const NAME = 'system/upgrade:tools' as const;
  export type Id = 'upgrade';
  export type Name = 'system/upgrade:tools';

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs & { latest?: boolean };
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
  export type CliContext = { readonly origin?: 'argv' | 'root-menu' };
  export type CliResult = void | { readonly kind: 'back' };

  /** Cached advisory status persisted between root CLI startups. */
  export type AdvisoryStatus = 'none' | 'upgrade-available' | 'pending' | 'resolver-unavailable';

  /** Cached advisory record persisted between root CLI startups. */
  export type AdvisoryRecord =
    | {
      readonly schemaVersion: 2;
      readonly ok: true;
      readonly checkedAt: t.UnixTimestamp;
      readonly package: t.StringPkgName;
      /** Version of the @sys/tools package that produced this advisory fact. */
      readonly local: t.StringSemver;
      /** Latest version published by JSR registry metadata. */
      readonly published: t.StringSemver;
      /** Version Deno resolved under active config, lock, cache, and policy. */
      readonly actionable?: t.StringSemver;
      /** Root advisory display state derived from Deno-actionable resolver truth. */
      readonly status: AdvisoryStatus;
      /** Resolver failure reason when status is resolver-unavailable. */
      readonly reason?: t.WorkspaceResolve.PackageResolutionReason;
    }
    | {
      readonly schemaVersion: 2;
      readonly ok: false;
      readonly checkedAt: t.UnixTimestamp;
      readonly package: t.StringPkgName;
      readonly error: string;
    };

  /** Table of upgrade versions. */
  export type VersionInfo = {
    /** Version of the currently executing @sys/tools package. */
    readonly local: t.StringSemver;
    /** Latest version published by JSR registry metadata. */
    readonly remote: t.StringSemver;
    /** Back-compat upgrade target; prefer `actionable` for new code. */
    readonly latest: t.StringSemver;
    /** Version Deno currently resolves under active config, lock, cache, and policy. */
    readonly actionable?: t.StringSemver;
    /** Raw Deno resolver fact when available. */
    readonly resolution?: t.WorkspaceResolve.PackageResolutionFact;
    readonly is: {
      /** True when there is no immediate actionable upgrade. */
      readonly latest: boolean;
      /** True when Deno currently resolves a version newer than local. */
      readonly upgradeAvailable?: boolean;
      /** True when JSR has a newer published version than Deno currently resolves. */
      readonly pending?: boolean;
      /** True when no Deno-actionable target could be verified. */
      readonly resolverUnavailable?: boolean;
    };
  };
}
