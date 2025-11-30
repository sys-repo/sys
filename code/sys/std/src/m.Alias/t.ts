import type { t } from './common.ts';

export type * from './t.namespace.ts';

type O = Record<string, unknown>;

/**
 * Alias table utilities:
 * - `make`    → lazy resolver over a YAML-ish object tree
 * - `analyze` → resolver plus table diagnostics
 * - `expand`  → pure string-level alias expansion
 */
export type AliasResolverLib = {
  readonly Is: t.AliasResolverIsLib;

  /**
   * Create a lazy resolver bound to the given object.
   *
   * - `root`:  object-path to the logical root of the document
   * - `alias`: object-path (relative to `root`) where the alias table lives
   *
   * The returned resolver:
   * - normalizes `root` to a plain record
   * - filters the alias table to valid `Alias.Key → string` entries
   */
  make(obj: O, opts?: { root?: t.ObjectPath; alias?: t.ObjectPath }): t.Alias.Resolver;

  /**
   * Inspect the alias table at the given root.
   *
   * Returns:
   * - `resolver`   : same semantics as `make`
   * - `diagnostics`: non-fatal issues (invalid keys, non-string values, etc.)
   *
   * Never throws; callers decide how to surface diagnostics (logs, markers, …).
   */
  analyze(obj: O, opts?: { root?: t.ObjectPath; alias?: t.ObjectPath }): t.Alias.TableAnalysis;

  /**
   * Pure syntactic alias expansion.
   *
   * - resolves alias tokens using the provided `Alias.Map`
   * - performs bounded iterative replacement (cycle-safe)
   * - returns the transformed value plus metadata
   */
  expand(
    raw: t.Alias.RawPath,
    map: t.Alias.Map,
    opts?: { maxDepth?: number },
  ): t.Alias.ExpandResult;
};

/**
 * Boolean guards for alias primitives.
 */
export type AliasResolverIsLib = {
  /**
   * True if the input is a well-formed alias key, e.g. ":core-assets".
   * Shape: ":" + lowercase letters/digits in hyphen-separated segments.
   */
  aliasKey(input?: unknown): input is t.Alias.Key;
};
