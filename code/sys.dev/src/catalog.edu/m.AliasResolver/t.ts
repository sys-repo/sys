import type { t } from './common.ts';

export type * from './t.namespace.ts';
type O = Record<string, unknown>;

/**
 * Alias path resolver primitives.
 */
export type AliasResolverLib = {
  readonly Is: t.AliasResolverIsLib;

  /**
   * Load an AliasMap from the aliasPath inside the root YAML object.
   */
  make(obj: O, opts?: { root?: t.ObjectPath; alias?: t.ObjectPath }): t.Alias.Resolver;

  /**
   * Analyze the alias table at the given root:
   * - returns the same Resolver as `make`
   * - plus diagnostics for any discarded or problematic entries.
   *
   * This stays sync and side-effect free; callers (e.g. Crdt.Graph.walk)
   * are responsible for attaching doc ids, logging, or editor markers.
   */
  analyze(obj: O, opts?: { root?: t.ObjectPath; alias?: t.ObjectPath }): t.Alias.TableAnalysis;
};

/**
 * Boolean guards.
 */
export type AliasResolverIsLib = {
  aliasKey(input?: unknown): input is t.Alias.Key;
};
