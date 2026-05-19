import { Is, Regex, type t } from './common.ts';

/** True when the pattern or pattern list matches the path. */
export function matches(pattern: t.Glob.Pattern | undefined, path: t.Glob.Path): boolean {
  if (pattern === undefined) return false;
  if (Is.string(pattern)) return matchesPattern(pattern, path);
  return pattern.some((item) => matchesPattern(item, path));
}

/**
 * Helpers:
 */
function matchesPattern(pattern: t.StringGlob, path: t.Glob.Path): boolean {
  const normalizedPattern = normalize(pattern);
  const normalizedPath = normalize(path);
  if (normalizedPattern === '**' || normalizedPattern === '**/*') return true;
  if (normalizedPattern === normalizedPath) return true;
  if (normalizedPattern.endsWith('/**')) {
    const base = normalizedPattern.slice(0, -3);
    if (normalizedPath === base) return true;
  }
  return globToRegExp(normalizedPattern).test(normalizedPath);
}

function normalize(input: string): string {
  return input.replaceAll('\\', '/').replace(/^\.\/+/, '');
}

function globToRegExp(glob: string): RegExp {
  let source = '^';

  // Cursor-managed parsing is intentional: `**` and `**/` require lookahead.
  for (let cursor = 0; cursor < glob.length; cursor++) {
    const char = glob[cursor];
    const next = glob[cursor + 1];
    const after = glob[cursor + 2];

    if (char === '*' && next === '*' && after === '/') {
      source += '(?:.*/)?';
      cursor += 2;
    } else if (char === '*' && next === '*') {
      source += '.*';
      cursor += 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else {
      source += Regex.escape(char);
    }
  }

  source += '$';
  return new RegExp(source);
}
