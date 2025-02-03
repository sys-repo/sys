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
 * Parses an import string of the form:
 *
 *   [<prefix>:]<name>[@<version>]
 *
 * Where:
 *   - `prefix` is either "jsr" or "npm" (optional),
 *   - `name` is the module name,
 *   - `version` is a semantic version (e.g. "1.2.3" or "1.2.3-beta", optional).
 *
 * If the version is not provided, the `version` property is set to an empty string.
 * If the input does not match the expected pattern, the function returns undefined.
 *
 * @param input - The ESM import string to parse.
 * @returns A JsrImport object or undefined if the input is invalid.
 */
export const parse: t.EsmLib['parse'] = (input) => {
  type T = t.EsmImport;

  const fail = (err: string) => done('', '', '', err);
  const done = (prefix: string, name: string, version: string, err?: string): t.EsmParsedImport => {
    const error = err ? Err.std(err) : undefined;
    return {
      input: String(input),
      prefix: prefix as T['prefix'],
      name,
      version,
      error,
    };
  };

  if (typeof input !== 'string') return fail(`Given ESM import is not a string (${typeof input})`);
  const text = input.trim();

  // Check if the input is a relative file path (e.g. "./foo/mod.ts" or "../bar/utils.ts")
  if (REGEX.filepath.test(text)) {
    return done('', text, ''); // NB: path → no prefix or version.
  }

  // Otherwise, attempt to parse as a package specifier.
  const match = text.match(REGEX.package);
  if (!match) return fail(`Failed to parse ESM import string`);

  const [, prefix, name, version] = match;
  return done(prefix ?? '', name, version ?? '');
};
