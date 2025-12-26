import type { t } from './common.ts';

/**
 * The `@sys/tools/update` namespace.
 */
export namespace UpdateTool {
  export const ID = 'update' as const;
  export const NAME = 'system/update:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs & { latest?: boolean };
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Table of update versions. */
  export type VersionInfo = {
    readonly local: t.StringSemver;
    readonly remote: t.StringSemver;
    readonly latest: t.StringSemver;
    readonly is: { readonly latest: boolean };
  };
}
