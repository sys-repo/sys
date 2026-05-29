import type { t } from './common.ts';

/**
 * The `@sys/tools/upgrade` namespace.
 */
export namespace UpgradeTool {
  export const ID = 'upgrade' as const;
  export const NAME = 'system/upgrade:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs & { latest?: boolean };
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
  export type CliContext = { readonly origin?: 'argv' | 'root-menu' };
  export type CliResult = void | { readonly kind: 'back' };

  /** Cached advisory record persisted between root CLI startups. */
  export type AdvisoryRecord =
    | {
      readonly ok: true;
      readonly checkedAt: t.UnixTimestamp;
      readonly package: t.StringPkgName;
      readonly remote: t.StringSemver;
    }
    | {
      readonly ok: false;
      readonly checkedAt: t.UnixTimestamp;
      readonly package: t.StringPkgName;
      readonly error: string;
    };

  /** Table of upgrade versions. */
  export type VersionInfo = {
    readonly local: t.StringSemver;
    readonly remote: t.StringSemver;
    readonly latest: t.StringSemver;
    readonly is: { readonly latest: boolean };
  };
}
