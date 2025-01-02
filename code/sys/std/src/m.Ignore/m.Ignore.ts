import { type t, Path } from './common.ts';
import { default as Lib } from 'ignore';

/**
 * Tools for working with ignore files (eg. ".gitignore").
 */
export const Ignore: t.GlobIgnoreLib = {
  /**
   * Create an instance of an glob-ignore helpers (eg. from a `.gititnore` file).
   */
  create(input) {
    const rules = wrangle.rules(input);
    const ignore = Lib.default();
    rules.forEach((rule) => ignore.add(rule.pattern));

    return {
      rules,
      isIgnored(path, root) {
        path = Path.normalize(path);
        if (root) path = Path.relative(root, path);
        return ignore.ignores(path);
      },
    };
  },
};

/**
 * Helpers
 */
const wrangle = {
  lines(input: string) {
    return input.split(/\r?\n/).map((line) => line.trim());
  },

  rules(input: Parameters<t.GlobIgnoreLib['create']>[0]): t.GlobIgnoreRule[] {
    if (!input || input === null) return [];

    if (Array.isArray(input)) {
      return input
        .map((item) => wrangle.lines(item))
        .flat()
        .filter((pattern) => !!pattern) //                Remove empty-lines.
        .filter((pattern) => !pattern.startsWith('#')) // Remove comments.
        .map((rules) => wrangle.rule(rules));
    }

    if (typeof input === 'string') {
      return wrangle.rules(wrangle.lines(input)); // Recursion 🌳
    }
    return [];
  },

  rule(pattern: t.StringGlobIgnore): t.GlobIgnoreRule {
    pattern = pattern.trim();
    return {
      pattern,
      isNegation: pattern.startsWith('!'),
    };
  },
} as const;
