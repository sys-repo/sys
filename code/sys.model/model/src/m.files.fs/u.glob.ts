import { Is, type t } from './common.ts';

/**
 * Match a Files path against a glob-like selector or selector list.
 */
export const matches = (match: t.Files.Match | undefined, path: t.Files.StringPath): boolean => {
  if (match === undefined) return false;
  if (Is.string(match)) return matchesPattern(match, path);
  return match.some((pattern) => matchesPattern(pattern, path));
};

/**
 * Helpers:
 */

const matchesPattern = (pattern: t.StringGlob, path: t.Files.StringPath): boolean => {
  const normalizedPattern = normalize(pattern);
  const normalizedPath = normalize(path);
  if (normalizedPattern === '**' || normalizedPattern === '**/*') return true;
  if (normalizedPattern === normalizedPath) return true;
  if (normalizedPattern.endsWith('/**')) {
    const base = normalizedPattern.slice(0, -3);
    if (normalizedPath === base) return true;
  }
  return globToRegExp(normalizedPattern).test(normalizedPath);
};

const normalize = (input: string): string => input.replaceAll('\\', '/').replace(/^\.\/+/, '');

const globToRegExp = (glob: string): RegExp => {
  let source = '^';
  for (let index = 0; index < glob.length; index++) {
    const char = glob[index];
    const next = glob[index + 1];
    const after = glob[index + 2];

    if (char === '*' && next === '*' && after === '/') {
      source += '(?:.*/)?';
      index += 2;
    } else if (char === '*' && next === '*') {
      source += '.*';
      index += 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else {
      source += escapeRegExp(char);
    }
  }
  source += '$';
  return new RegExp(source);
};

const escapeRegExp = (input: string): string => input.replace(/[\\^$+?.()|[\]{}]/g, '\\$&');
