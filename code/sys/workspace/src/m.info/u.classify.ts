import { type t } from './common.ts';
import { DEFAULTS } from './u.defaults.ts';

/** Classify a matched source path into the workspace info line partition. */
export function classifyPath(
  path: t.StringPath,
  rules: readonly t.WorkspaceInfo.TestPathRule[] = DEFAULTS.testPathRules,
): t.WorkspaceInfo.LineKind {
  const segments = path.split(/[\\/]+/);
  const basename = segments.at(-1) ?? '';
  const directories = segments.slice(0, -1);

  for (const rule of rules) {
    if (matchesRule(rule, basename, directories)) return rule.kind;
  }

  return 'source';
}

function matchesRule(
  rule: t.WorkspaceInfo.TestPathRule,
  basename: string,
  directories: readonly string[],
): boolean {
  return matchesBasename(rule.basenamePatterns, basename) ||
    directories.some((segment) => matchesDirectorySegment(rule.directorySegments, segment));
}

function matchesBasename(patterns: readonly RegExp[] | undefined, basename: string): boolean {
  return (patterns ?? []).some((pattern) => testPattern(pattern, basename));
}

function matchesDirectorySegment(
  rule: t.WorkspaceInfo.TestPathRule['directorySegments'],
  segment: string,
): boolean {
  return (rule?.exact ?? []).includes(segment) ||
    (rule?.prefixes ?? []).some((prefix) => segment.startsWith(prefix));
}

function testPattern(pattern: RegExp, value: string): boolean {
  const lastIndex = pattern.lastIndex;
  try {
    pattern.lastIndex = 0;
    return pattern.test(value);
  } finally {
    pattern.lastIndex = lastIndex;
  }
}
