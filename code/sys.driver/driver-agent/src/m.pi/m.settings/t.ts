import type { t } from './common.ts';

/**
 * Types for wrapper-owned Pi settings.
 *
 * These types describe the generated Pi settings surface that the wrapper
 * writes under project-local `.pi/settings.json`.
 */
export declare namespace PiSettings {
  /** Runtime surface for wrapper-owned Pi settings. */
  export type Lib = {
    /** Filesystem helpers for wrapper-owned Pi settings. */
    readonly Fs: PiSettings.Fs;
    /** Resolve the wrapper-owned Pi settings document. */
    resolve(input?: ResolveInput): Doc;
  };

  /** Generated Pi `settings.json` document owned by the wrapper. */
  export type Doc = {
    /** Suppress the verbose upstream startup surface. */
    readonly quietStartup: boolean;
    /** Collapse the upstream changelog surface on startup. */
    readonly collapseChangelog: boolean;
  };

  /** Partial wrapper-owned settings overrides merged over deterministic defaults. */
  export type ResolveInput = Partial<Doc>;

  /** Write the canonical settings document for the given project root. */
  export type WriteArgs = {
    /** Project root under which `.pi/settings.json` is materialized. */
    readonly cwd: t.StringDir;
    /** Optional overrides merged over wrapper-owned defaults before writing. */
    readonly settings?: ResolveInput;
  };

  /** Filesystem helpers for wrapper-owned Pi settings. */
  export type Fs = {
    /** Resolve the project-local `.pi/` directory. */
    dirOf(cwd: t.StringDir): t.StringDir;
    /** Resolve the project-local Pi settings file path. */
    pathOf(cwd: t.StringDir): t.StringPath;
    /** Materialize the canonical settings document under `.pi/settings.json`. */
    write(input: WriteArgs): Promise<t.StringPath>;
  };

  /** Validation result for a generated Pi settings document. */
  export type JsonCheck =
    | { readonly ok: true; readonly doc: Doc }
    | { readonly ok: false; readonly errors: readonly unknown[] };
}
