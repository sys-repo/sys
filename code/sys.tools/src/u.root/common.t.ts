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
export type StringDir = string;
export type ArgsAliasMap<K extends string> = Partial<Record<K, readonly [string, ...string[]]>>;
export type ParsedArgs<T extends Record<string, unknown>> = T & { readonly _: readonly string[] };

/**
 * Root command and argument types used by the launcher before a specific tool
 * module is selected and loaded.
 */
export namespace Root {
  /** Tool command ids handled by the root launcher. */
  export type Command =
    | 'pull'
    | 'serve'
    | 'pi'
    | 'deploy'
    | 'crdt'
    | 'crypto'
    | 'video'
    | 'copy'
    | 'tmpl'
    | 'update';

  /** Invocation origin passed from the root launcher to selected tools. */
  export type ToolCliOrigin = 'argv' | 'root-menu';
  export type ToolCliContext = { readonly origin: ToolCliOrigin };

  /** Shared root CLI flags accepted before tool dispatch. */
  export type CliArgs = { help: boolean; debug?: boolean; noUpdateCheck?: boolean };

  /** Root-level argument shape parsed from the launcher argv. */
  export type CliRootArgs = CliArgs & { readonly 'no-update-check'?: boolean };

  /** Parsed root args, with an optional resolved tool command. */
  export type CliRootParsedArgs = ParsedArgs<CliRootArgs> & { readonly command?: Command };
}
