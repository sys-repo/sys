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
   * Resolver mecahnic
   */
  export type Resolver<T extends O = O> = {
    readonly root: T;
    readonly alias: t.Alias.Map;
  };
}
