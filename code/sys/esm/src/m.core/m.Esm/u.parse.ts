/**
 * @module
 * Parse ESM module-specifier strings.
 */
import { type t, Err, Is } from './common.ts';
import { Is as EsmIs } from './m.Is.ts';
import { toString } from './u.toString.ts';

/**
 * Supported package-spec grammar:
 *
 *   - registry:
 *       - `jsr:` or `npm:`
 *       - optional for bare package imports.
 *
 *   - package name:
 *       - unscoped: `react`
 *       - scoped: `@scope/pkg`
 *
 *   - version selector:
 *       - optional
 *       - supports pinned numeric versions:
 *         - `1`
 *         - `1.2`
 *         - `1.2.3`
 *       - supports a single comparator prefix:
 *         - `~ ^ > < >= <=`
 *       - supports prerelease suffixes:
 *         - `1.2.3-alpha.1`
 *         - `0.56.0-dev-20260211`
 *
 *   - subpath:
 *       - optional trailing package subpath:
 *         - `/server`
 *         - `/foo/bar`
 *
 * Explicit non-goals for this parser:
 *   - full npm semver/range grammar
 *   - build metadata (`+build`)
 *   - unions such as `^1 || ^2`
 *   - wildcard/tag selectors such as `1.x`, `*`, or `latest`
 *
 * Regex breakdown:
 *   ^                                                        : start of string.
 *   (?:(jsr|npm):)?                                          : optionally match and capture "jsr:" or "npm:"
 *   ((?:@[\w.-]+\/)?[\w.-]+)                                 : capture the module name (optionally scoped).
 *   (?:@((?:~|\^|>|<|>=|<=)?\d+(?:\.\d+){0,2}(?:-[\w.-]+)?))? : optionally match "@" followed by a supported version selector.
 *   (\/[\w\/.-]+)?                                           : optionally capture a subpath starting with a slash.
 *   $                                                        : end of string
 */
const REGEX = {
  package:
    /^(?:(jsr|npm):)?((?:@[\w.-]+\/)?[\w.-]+)(?:@((?:~|\^|>|<|>=|<=)?\d+(?:\.\d+){0,2}(?:-[\w.-]+)?))?(\/[\w\/.-]+)?$/,
} as const;

/**
 * Parses an import module-specifier string into package-spec parts.
 *
 * Local paths short-circuit before package parsing. Package-spec parsing is
 * intentionally narrower than full npm semver/range support; this helper owns
 * the supported workspace package-spec contract, not generic registry parsing.
 */
export const parse: t.EsmLib['parse'] = (moduleSpecifier, alias) => {
  type T = t.EsmImport;

  const fail = (err: string) => done('', '', '', '', err);
  const done = (
    registry: string,
    name: string,
    version: string,
    subpath: string,
    err?: string,
  ): t.EsmParsedImport => {
    const error = err ? Err.std(err) : undefined;
    const api: t.EsmParsedImport = {
      input: String(moduleSpecifier),
      registry: registry as T['registry'],
      name,
      subpath,
      version,
      alias,
      error,
      toString: () => toString(api),
    };
    return api;
  };

  if (!Is.str(moduleSpecifier)) {
    return fail('Given ESM import is not a string');
  }

  const text = moduleSpecifier.trim();
  if (EsmIs.localPath(text)) {
    return done('', text, '', ''); // NB: "path" specifier → no prefix or version.
  }

  // Otherwise, attempt to parse as a package specifier.
  const match = text.match(REGEX.package);
  if (!match) return fail(`Failed to parse ESM module-specifier string ("${moduleSpecifier}")`);

  const [, registry = '', name, version = '', rawSubpath] = match;
  const subpath = rawSubpath ? rawSubpath.replace(/^\/*/, '') : '';
  return done(registry, name, version, subpath);
};
