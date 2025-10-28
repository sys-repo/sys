import type { t } from './common.ts';
export type * from './ui.ObjectView/t.ts';

/**
 * Library: Dev helpers.
 */
export type DevLib = {
  readonly ObjectView: t.FC<t.CrdtObjectViewProps>;

  /**
   * Construct a normalized, display-safe string label for a given object path.
   *
   * ## Format
   * ```
   * <prefix>:<joined-path | (none)>
   * ```
   * - For non-empty paths, a leading "/" is included before joined segments.
   * - Segments are joined with "/" (YAML/filesystem semantics).
   * - All "." characters are replaced with ":" for UI safety.
   *
   * ### Examples
   * ```ts
   * fieldFromPath(['yaml', 'parsed']);
   * // → "doc:/yaml/parsed"
   *
   * fieldFromPath(['foo.bar', 'baz']);
   * // → "doc:/foo:bar/baz"
   *
   * fieldFromPath([]);
   * // → "doc:(none)"
   *
   * fieldFromPath(['slug', 'props'], { prefix: 'slug' });
   * // → "slug:/slug/props"
   * ```
   */
  fieldFromPath(path?: t.ObjectPath, opts?: { prefix?: string }): string;

  /**
   * Construct an array of `<ObjectView>`-safe expand paths.
   *
   * - Always includes the root: `"$"`.
   * - Accepts a list of paths (`(t.ObjectPath | undefined)[]`).
   * - Each valid path is converted via `fieldFromPath(...)` and
   *   prefixed with `"$."` (e.g., `$.doc:/a/b`).
   * - Empty or undefined paths are skipped.
   *
   * ## Examples
   * ```ts
   * expandPaths([['yaml', 'parsed']]);
   * // → ['$', '$.doc:/yaml/parsed']
   *
   * expandPaths([
   *   ['yaml', 'parsed'],
   *   ['slug', 'props'],
   * ]);
   * // → ['$', '$.doc:/yaml/parsed', '$.doc:/slug/props']
   *
   * expandPaths([['slug', 'props']], { prefix: 'slug' });
   * // → ['$', '$.slug:/slug/props']
   *
   * expandPaths([undefined, []]);
   * // → ['$']
   * ```
   */
  expandPaths(path: (t.ObjectPath | undefined)[], opts?: { prefix?: string }): string[];
};
