import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * AliasResolver: Type Definitions
 *
 * This module defines the abstract model:
 * - AliasMap          (symbolic → raw paths)
 * - RawPath / ResolvedPath
 * - ObjectPath        (YAML tree navigation)
 * - Ref               (typed semantic reference)
 * - RefResolver       (scheme-based resolver plugin)
 * - AliasContext      (where alias table lives)
 * - AliasResolver     (the abstract contract)
 */
export namespace Alias {
  /** A symbolic alias key, always starting with ":". */
  export type Key = `:${string}`;

  /** A raw, unexpanded string path possibly containing alias references. */
  export type RawPath = string;
  /**
   * A fully-expanded path with aliases resolved and normalized.
   * Still a plain string, but guaranteed not to contain alias tokens.
   */
  export type ResolvedPath = string;

  /** AliasMap: the table mapping symbolic alias keys to raw path strings. */
  export type Map = {
    readonly [K in Alias.Key]?: Alias.RawPath;
  };

  /**
   * A semantic reference produced after alias expansion + resolution.
   * Concrete resolvers extend this via discriminated unions.
   */
  export type Ref = {
    readonly scheme: string;
    readonly href: ResolvedPath;
  };

  /**
   * RefResolver:
   * A plugin that interprets one scheme (e.g., "fs", "crdt").
   */
  export type RefResolver = {
    readonly scheme: string;
    resolve(path: ResolvedPath): Promise<Ref>;
  };

  /**
   * Resolver mechanic
   */
  export type Resolver<T extends O = O> = {
    readonly root: T;
    readonly alias: t.Alias.Map;
  };

  /**
   * Alias diagnostics:
   * - table-level issues (invalid keys, non-string values, non-object tables)
   * - future expansion/resolution issues can extend this union
   */
  export type DiagnosticKind =
    | 'alias:invalid-key'
    | 'alias:non-string-value'
    | 'alias:non-object-table'
    // Future kinds (for expand/resolve) – reserved, not yet emitted:
    | 'alias:unknown-token'
    | 'alias:cycle'
    | 'alias:max-depth'
    | 'alias:unknown-scheme'
    | 'alias:resolver-error';

  export type Diagnostic = {
    readonly kind: DiagnosticKind;
    /**
     * Path inside the YAML object where the issue occurred.
     * For table-level problems this will usually point at the alias table
     * or a specific entry inside it.
     */
    readonly path: t.ObjectPath;
    /** Alias key (e.g. ":core-assets") if applicable. */
    readonly key?: string;
    /** Specific alias token inside a path (e.g. ":index"), for expansion issues. */
    readonly token?: string;
    /** Original value that triggered the issue, when helpful. */
    readonly value?: unknown;
    /** Human-readable description used by callers (logs, editor markers, etc). */
    readonly message: string;
  };

  /**
   * Result of analyzing a single alias table at a given root.
   * Always returns a usable Resolver plus any diagnostics encountered.
   */
  export type TableAnalysis<T extends O = O> = {
    readonly resolver: Resolver<T>;
    readonly diagnostics: readonly Diagnostic[];
  };
}
