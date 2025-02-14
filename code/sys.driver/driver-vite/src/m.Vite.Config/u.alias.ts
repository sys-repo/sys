import type { t } from './common.ts';

/**
 * Generate a regex to match:
 *   "<prefix>:<module-name>@<version>/path"
 *   "<prefix>:<module-name>@<version>"
 *   "<prefix>:<module-name>/path"
 *   "<prefix>:<module-name>"
 *
 * The regex:
 *  - Escapes the module name.
 *  - Optionally matches a version (with an optional modifier and pre-release).
 *  - Optionally captures a trailing path (starting with a slash) in capture group 1.
 */
export function toAliasRegex(prefix: string, moduleName: string): RegExp {
  const name = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape module name.
  const modifier = '(?:\\^|~|>=|<=|>|<)?';

  // Matches a core version (one to three numeric components)
  const versionCore = '\\d+(?:\\.\\d+){0,2}';
  // Optionally matches a pre-release identifier (e.g., "-alpha" or "-alpha.1")
  const preRelease = '(?:-[\\w.]+)?';
  const versionPattern = `${modifier}${versionCore}${preRelease}`;

  // Build the regex:
  //  - Starts with "<prefix>:<name>"
  //  - Optionally followed by "@" and the version (non-capturing)
  //  - Optionally followed by a trailing path (captured as group 1)
  return new RegExp(`^${prefix}:${name}(?:@(?:${versionPattern}))?(\\/.*)?$`);
}

/**
 * Construct a Vite/Rollup alias configuration object.
 *
 * The returned alias object uses a regex (via toAliasRegex) to match module references.
 * The replacement string is built by appending a captured trailing subpath (if any)
 * to the base moduleName.
 *
 * For example:
 *   Input: "npm:@vidstack/react@1.12.12" yields replacement: "@vidstack/react"
 *   Input: "npm:@vidstack/react@1.12.12/player/layouts/plyr" yields replacement: "@vidstack/react/player/layouts/plyr"
 */
export function toAlias(prefix: string, moduleName: string): t.ViteAlias {
  const trimmedModuleName = (moduleName || '').trim();
  const find = toAliasRegex(prefix, trimmedModuleName);
  // Append the captured subpath (if any) via "$1" to the base moduleName.
  const replacement = trimmedModuleName + '$1';
  return {
    find,
    replacement,
  };
}
