/**
 * @module
 * Tools for evaluating boolean flags on JSR related data.
 */
import { type t, Err } from './common.ts';

/**
 * Regex breakdown:
 *   - For file paths:
 *       ^                                     : start of string
 *       (?:\/|\.\/|\.\.\/)                    : match an absolute path ("/") or a relative path ("./" or "../")
 *       [\w\/.-]+                            : one or more word characters, slashes, dots, or hyphens
 *       \.[\w]+                              : a dot followed by one or more word characters (the file extension)
 *       $                                    : end of string
 *
 *   - For package specifiers:
 *       ^                                     : start of string
 *       (?:(jsr|npm):)?                       : optionally match and capture "jsr:" or "npm:"
 *       ((?:@[\w.-]+\/)?[\w.-]+)               : capture the module name (optionally scoped)
 *       (?:@([~^]?\d+(?:\.\d+){0,2}(?:-[\w.]+)?))? : optionally match "@" followed by a semantic version
 *       $                                     : end of string
 */
const REGEX = {
  filepath: /^(?:\/|\.\/|\.\.\/)[\w\/.-]+\.[\w]+$/,
  package: /^(?:(jsr|npm):)?((?:@[\w.-]+\/)?[\w.-]+)(?:@([~^]?\d+(?:\.\d+){0,2}(?:-[\w.]+)?))?$/,
} as const;

/**
 * Parses an "import" module-specifier string.
 */
export const parse: t.EsmLib['parse'] = (moduleSpecifier) => {
  type T = t.EsmImport;

  const fail = (err: string) => done('', '', '', err);
  const done = (prefix: string, name: string, version: string, err?: string): t.EsmParsedImport => {
    const error = err ? Err.std(err) : undefined;
    return {
      input: String(moduleSpecifier),
      prefix: prefix as T['prefix'],
      name,
      version,
      error,
    };
  };

  if (typeof moduleSpecifier !== 'string') {
    return fail(`Given ESM import is not a string (${typeof moduleSpecifier})`);
  }

  // Check if the input is a relative file path (e.g. "./foo/mod.ts" or "../bar/utils.ts")
  const text = moduleSpecifier.trim();
  if (REGEX.filepath.test(text)) {
    return done('', text, ''); // NB: "path" specifier → no prefix or version.
  }

  // Otherwise, attempt to parse as a package specifier.
  const match = text.match(REGEX.package);
  if (!match) return fail(`Failed to parse ESM module-specifier import string`);

  const [, prefix, name, version] = match;
  return done(prefix ?? '', name, version ?? '');
};
