import type { t } from './common.ts';

/**
 * Tools for introspecting YAML Abstract Syntax Trees (ASTs)
 * and associated source maps.
 */
export const Sourcemap: t.YamlSourcemapLib = {
  /** Resolve an object-path to token positions using a source map. */
  locate(map, path) {
    const hit = map.lookup(path);
    return hit ? (hit.value ?? hit.key) : undefined;
  },
};
