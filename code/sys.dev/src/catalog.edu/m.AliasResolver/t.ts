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
   * Expand one RawPath string using an AliasMap.
   * Nested alias references allowed; cycles forbidden.
 * Boolean guards.
 */
export type AliasResolverIsLib = {
  aliasKey(input?: unknown): input is t.Alias.Key;
};
