import type { t } from './common.ts';

/**
 * Deno app entry contract for local runtime and Deno Deploy.
 */
export declare namespace DenoEntry {
  /** Public Deno entry module surface. */
  export type Lib = {
    readonly serve: Serve;
  };

  /**
   * Root entry adapter. Imports the target's `src/pkg.ts` metadata before choosing an entry.
   * With package-local `src/entry.ts`, calls `main`; no Dist artifacts are required.
   * Otherwise, requires a supported Dist artifact: valid `dist.json` with `sys.dist/v2`
   * content identity and its declared payload files. Checks the complete tree for
   * unpinned local consistency at startup; undeclared entries or symlinks can refuse it.
   * Returns a fetch-handler object, not a bound listening server.
   *
   * Fixed verification limits for the static fallback:
   * - manifest: 4 MiB;
   * - tree: 16,384 entries, including the manifest, files, and distinct implied directories;
   * - individual payload file: 64 MiB;
   * - total payload: 512 MiB.
   *
   * Exceeding a limit rejects startup even for a consistent artifact.
   * Additional path and encoding bounds apply; these budgets are not exhaustive.
   * This check supplies no independent pin or document-signature verification and does
   * not verify subsequent response bytes or authenticate source imports.
   *
   * @see [Filesystem verification limits](../../../../../sys/fs/src/m.Pkg/t.ts)
   * @see [Content admission bounds](../../../../../sys/std/src/m.Pkg/m/m.Dist.Content.ts)
   */
  export type Serve = (options: ServeOptions) => Promise<EntryResult>;

  /** Package-local `src/entry.ts` hook; receives only the relative target selector. */
  export type Main = (ctx: EntryContext) => EntryResult | Promise<EntryResult>;

  /** Options for resolving and serving a staged target entry. */
  export type ServeOptions = {
    /** Resolution anchor; defaults to the process working directory and is canonicalized. */
    readonly cwd?: t.StringDir;
    /** Target directory resolved relative to `cwd`; must remain within that anchor. */
    readonly targetDir: t.StringRelativeDir;
    /** Static artifact directory resolved relative to the target; defaults to `dist`. */
    readonly distDir?: t.StringRelativeDir;
  };

  /** Runtime context passed into a package-local `src/entry.ts`. */
  export type EntryContext = {
    /**
     * Caller target selector, prefixed with `./` if needed; not an absolute path
     * or a generally normalized path. The `cwd` option is not passed to `main`.
     */
    readonly targetDir: t.StringRelativeDir;
  };

  /** Standard request handler used by entry results. */
  export type EntryFetch = (
    req: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Response | Promise<Response>;

  /** Standard fetch handler shape returned by an entry. */
  export type EntryResult = { readonly fetch: EntryFetch };
}
