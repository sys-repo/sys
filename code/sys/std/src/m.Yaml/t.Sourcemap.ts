import type { t } from './common.ts';

/**
 * Tools for working with AST (abstract-sytax-trees) and source-maps.
 */
export type YamlSourcemapLib = {
  /** Resolve an object-path to its corresponding source positions. */
  readonly locate: t.YamlLocateFn;

};

/**
 * Resolve an object-path to its corresponding token position(s)
 * using any `YamlSourceMapLike` (e.g. from `yaml-source-map`).
 *
 * Returns the same structure as `YamlSourceMapLike.lookup().value`
 * — a `YamlTokenPos` describing the node’s value span.
 */
export type YamlLocateFn = (
  map: t.YamlSourceMapLike,
  path: t.ObjectPath,
) => t.YamlTokenPos | undefined;

/**
 * Position data for a single YAML token (key or value)
 * as resolved by a source map.
 */
export type YamlTokenPos = {
  /** Byte/character offsets `[start, end)` within the source. */
  readonly pos: [number, number];
  /** 1-based line/column coordinates `[start, end]`. */
  readonly linePos: [t.YamlLinePos, t.YamlLinePos];
};

/**
 * Minimal source-map contract for YAML AST lookups.
 *
 * Compatible with `yaml-source-map` and similar tools exposing
 * a `lookup(path)` method that maps object-paths to token positions.
 */
export type YamlSourceMapLike = {
  /**
   * Resolve a JSON-path style address into source positions.
   *
   * @param path Object-path array, e.g. `['spec', 'containers', 0, 'image']`.
   * @returns Positions for the node’s value and/or key, or `undefined` if not found.
   */
  lookup(path: t.ObjectPath): undefined | { value?: t.YamlTokenPos; key?: t.YamlTokenPos };
};
