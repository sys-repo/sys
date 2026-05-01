import type { t } from './common.ts';

/**
 * Types for boundary-owned Pi settings.
 *
 * These types describe the Pi settings fragment that the typed Deno boundary
 * merges into the git-rooted Pi agent runtime settings.
 */
export declare namespace PiSettings {
  /** Runtime surface for boundary-owned Pi settings. */
  export type Lib = {
    /** Filesystem helpers for boundary-owned Pi settings. */
    readonly Fs: PiSettings.Fs;
    /** Resolve the boundary-owned Pi settings fragment. */
    resolve(input?: ResolveInput): Doc;
  };

  /** Pi `settings.json` fragment owned by the boundary. */
  export type Doc = {
    /** Suppress the verbose upstream startup surface. */
    readonly quietStartup: boolean;
    /** Collapse the upstream changelog surface on startup. */
    readonly collapseChangelog: boolean;
  };

  /** Partial boundary-owned settings overrides merged over deterministic defaults. */
  export type ResolveInput = Partial<Doc>;

  /** Write the canonical settings fragment for the given git root. */
  export type WriteArgs = {
    /** Git root under which `.pi/agent/settings.json` is materialized. */
    readonly cwd: t.StringDir;
    /** Optional overrides merged over boundary-owned defaults before writing. */
    readonly settings?: ResolveInput;
  };

  /** Filesystem helpers for boundary-owned Pi settings. */
  export type Fs = {
    /** Resolve the git-rooted Pi agent settings directory. */
    dirOf(cwd: t.StringDir): t.StringDir;
    /** Resolve the git-rooted Pi agent settings file path. */
    pathOf(cwd: t.StringDir): t.StringPath;
    /** Merge the canonical settings fragment into `.pi/agent/settings.json`. */
    write(input: WriteArgs): Promise<t.StringPath>;
  };

  /** Validation result for a boundary-owned Pi settings fragment. */
  export type JsonCheck =
    | { readonly ok: true; readonly doc: Doc }
    | { readonly ok: false; readonly errors: readonly unknown[] };
}
