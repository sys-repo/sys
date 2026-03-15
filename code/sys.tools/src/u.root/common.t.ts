/**
 * Root-local type seam for the `@sys/tools` launcher.
 *
 * This file exists to keep root startup isolated from the package-wide
 * `types.ts` barrel. Only launcher-local contracts belong here.
 *
 * Boundary note:
 * - Use `/Users/phil/code/org.sys/sys/code/sys.tools/src/types.ts` for the
 *   public package type surface.
 * - Use this file only for cold-start root launcher paths that must stay
 *   isolated from package-wide runtime/type barrels.
 */
import type { ParsedArgs } from '@sys/std/t';

export type { StringDir } from '@sys/types';
export type { ArgsAliasMap, ParsedArgs } from '@sys/std/t';

/**
 * Root command and argument types used by the launcher before a specific tool
 * module is selected and loaded.
 */
export namespace Root {
  /** Tool command ids handled by the root launcher. */
  export type Command =
    | 'pull'
    | 'serve'
    | 'deploy'
    | 'crdt'
    | 'crypto'
    | 'video'
    | 'copy'
    | 'tmpl'
    | 'update';

  /** Shared root CLI flags accepted before tool dispatch. */
  export type CliArgs = { help: boolean; debug?: boolean };

  /** Root-level argument shape parsed from the launcher argv. */
  export type CliRootArgs = CliArgs & {};

  /** Parsed root args, with an optional resolved tool command. */
  export type CliRootParsedArgs = ParsedArgs<CliRootArgs> & { readonly command?: Command };
}
