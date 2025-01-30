import { default as Lib } from 'ignore';
import { type t, Path } from './common.ts';

/**
 * Tools for working with ignore files (eg. ".gitignore").
 */
export const Ignore: t.IgnoreLib = {
  /**
   * Create an instance of a glob-ignore helper (eg. from a `.gititnore` file).
   */
  create(input) {
    const rules = wrangle.rules(input);
    const ignore = Lib();
    rules.forEach((rule) => ignore.add(rule.pattern));
    return {
      rules,
      isIgnored(path, root) {
        path = wrangle.path(path, root);
        return ignore.ignores(path);
      },
      check(path, root) {
        path = wrangle.path(path, root);
        const result = ignore.checkIgnore(path) as t.IgnoreCheckPathResult;
        const { ignored, unignored } = result;
        const rule = result.rule
          ? rules.find((item) => item.pattern === result.rule?.pattern)
          : undefined;
        return { ignored, unignored, rule };
      },
    };
  },
};

/**
 * Helpers
 */
const wrangle = {
  path(path: string, root?: string) {
    path = Path.normalize(path);
    return root ? Path.relative(root, path) : path;
  },

  lines(input: string) {
    return input.split(/\r?\n/).map((line) => line.trim());
  },

  rule(pattern: string): t.IgnoreRule {
    pattern = pattern.trim();
    const negative = pattern.startsWith('!');
    return { pattern, negative };
  },

  rules(input: Parameters<t.IgnoreLib['create']>[0]): t.IgnoreRule[] {
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
} as const;
