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
      /** Resolver reason when a published version is pending, standing down, or unavailable. */
      readonly reason?: t.WorkspaceResolve.PackageResolutionReason;
      /** Proven minimum dependency age standdown timing when the advisory was checked. */
      readonly minimumDependencyAgeStanddown?: MinimumDependencyAgeStanddown;
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
    /** JSR creation timestamp for the latest published version when reported by registry metadata. */
    readonly remoteCreatedAt?: t.StringTimestamp;
    /** Back-compat upgrade target; prefer `actionable` for new code. */
    readonly latest: t.StringSemver;
    /** Version Deno currently resolves under active config, lock, cache, and policy. */
    readonly actionable?: t.StringSemver;
    /** Raw Deno resolver fact for the unpinned package specifier when available. */
    readonly resolution?: t.WorkspaceResolve.PackageResolutionFact;
    /** Raw Deno resolver fact for the published latest version when probing a standdown. */
    readonly latestResolution?: t.WorkspaceResolve.PackageResolutionFact;
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

  /** Derived upgrade truth state used by display, execution, and advisory persistence. */
  export type VersionState = {
    /** True when JSR has published a version newer than the current CLI. */
    readonly hasNewerRelease: boolean;
    /** Version Deno can currently execute after cache refresh. */
    readonly actionable?: t.StringSemver;
    /** True when there is an immediate Deno-actionable upgrade. */
    readonly upgradeAvailable: boolean;
    /** True when a newer published release exists but no newer version is currently actionable. */
    readonly pending: boolean;
    /** True when Deno could not verify an actionable version. */
    readonly resolverUnavailable: boolean;
    /** Advisory-compatible status derived from the same truth flags. */
    readonly status: AdvisoryStatus;
    /** Resolver reason when Deno reported one for the actionable or latest-version probe. */
    readonly reason?: t.WorkspaceResolve.PackageResolutionReason;
    /** Proven minimum dependency age standdown timing for the latest published version. */
    readonly minimumDependencyAgeStanddown?: MinimumDependencyAgeStanddown;
  };

  /** Derived timing fact for a latest-version minimum dependency age standdown. */
  export type MinimumDependencyAgeStanddown = {
    /** Latest published version still inside the minimum dependency age window. */
    readonly version: t.StringSemver;
    /** JSR creation timestamp for the latest published version. */
    readonly createdAt: t.StringTimestamp;
    /** Deno resolver cutoff date for the active minimum dependency age policy. */
    readonly minimumDependencyDate: t.StringTimestamp;
    /** Duration until the latest published version clears the active cutoff. */
    readonly remaining: t.Msecs;
  };
}
