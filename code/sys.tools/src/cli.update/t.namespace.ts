import type { t } from './common.ts';

/**
 * The `@sys/tools/update` namespace.
 */
export namespace UpdateTool {
  export type Id = 'update';
  export type Name = 'system/update:tools';

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
