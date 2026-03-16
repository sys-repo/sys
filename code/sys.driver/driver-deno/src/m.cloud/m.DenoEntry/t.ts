import type { t } from './common.ts';

/**
 * Deno app entry contract for local runtime and Deno Deploy.
 */
export declare namespace DenoEntry {
  /** Public Deno entry module surface. */
  export type Lib = {
  };

  /** Options for resolving and serving a staged target entry. */
  export type ServeOptions = {
    readonly targetDir: t.StringRelativeDir;
    readonly distDir?: t.StringRelativeDir;
  };

  /** Runtime context passed into a package-local `src/entry.ts`. */
  export type EntryContext = {
    readonly targetDir: t.StringRelativeDir;
  };

  /** Standard fetch handler shape returned by an entry. */
  export type EntryResultFetch = { readonly fetch: EntryFetch };

  /** Standard request handler used by entry results. */
  export type EntryFetch = (
    req: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Response | Promise<Response>;

  /** Supported result returned by a package entry `main(ctx)`. */
  export type EntryResult = Response | EntryResultFetch;

  /** Package-local runtime hook signature. */
  export type Main = (ctx: EntryContext) => EntryResult | Promise<EntryResult>;

  /** Root entry adapter signature. */
  export type Serve = (options: ServeOptions) => Promise<EntryResultFetch>;
}
