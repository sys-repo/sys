import type { t } from './common.ts';

/**
 * Match:
 *    "<npm>:<module-name>@<0.0.0>/path"
 *    "<npm>:<module-name>/path"
 */
export function toAliasRegex(prefix: string, moduleName: string): RegExp {
  const name = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // NB: escape characters.
  const modifier = '(?:\\^|~|>=|<=|>|<)?';

  /**
   * Matches a version number:
   *  - A core version (one to three numeric components)
   *  - An optional pre-release (e.g. "-alpha" or "-alpha.1")
   */
  const versionCore = '\\d+(?:\\.\\d+){0,2}';
  const preRelease = '(?:-[\\w.]+)?';
  const versionPattern = `${modifier}${versionCore}${preRelease}`;

  /**
   * Build the full regex:
   *  - Starts with the prefix and module name.
   *  - Optionally followed by "@" and the version (with an optional modifier).
   *  - Optionally followed by a trailing path.
   */
  return new RegExp(`^${prefix}:${name}(?:@(${versionPattern}))?(?:\\/.*)?$`);
}

/**
 * Construct a replacement regex to use an as alias for a module/import lookup
 * within the Vite/Rollup/alias configuration.
 */
export function toAlias(prefix: string, moduleName: string): t.ViteAlias {
  const replacement = (moduleName || '').trim();
  const find = toAliasRegex(prefix, replacement);
  return {
    find,
    replacement,
  };
}
