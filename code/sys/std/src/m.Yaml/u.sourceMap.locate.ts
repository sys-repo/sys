import type { t } from './common.ts';

/**
 * Resolve an object-path to token positions using a source map.
 */
export const locate: t.YamlLocateFn = (map, path) => {
  const hit = map.lookup(path);
  if (!hit) return undefined;
  return hit.value ?? hit.key;
};
