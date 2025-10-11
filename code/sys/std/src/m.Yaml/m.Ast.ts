import type { t } from './common.ts';

/**
 * Tools for introspecting YAML Abstract Syntax Trees (ASTs)
 * and associated source maps.
 */
export const Ast: t.YamlAstLib = {
  /** Resolve an object-path to token positions using a source map. */
  locate(map, path) {
    const hit = map.lookup(path);
    if (!hit) return undefined;
    return hit.value ?? hit.key;
  },
};
