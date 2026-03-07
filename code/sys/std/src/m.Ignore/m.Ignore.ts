import { default as BaseLib } from 'ignore';
import { type t, Path } from './common.ts';

/**
 * Tools for working with ignore files (eg. ".gitignore").
 */
export const Ignore: t.IgnoreLib = {
  normalize(input) {
    return wrangle.normalize(input);
  },

  serialize(input) {
    return wrangle.serialize(input);
  },

  async digest(input) {
    return await wrangle.digest(input);
  },

  /**
   * Create an instance of a glob-ignore helper (eg. from a `.gititnore` file).
   */
  create(input) {
    const rules = wrangle.rules(wrangle.normalize(input));
    const ignore = BaseLib();
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

  normalize(input: t.IgnoreInput): readonly string[] {
    if (!input || input === null) return [];

    if (Array.isArray(input)) {
      return input
        .map((item) => wrangle.lines(item))
        .flat()
        .filter((pattern) => !!pattern) //                Remove empty-lines.
        .filter((pattern) => !pattern.startsWith('#')); // Remove comments.
    }

    if (typeof input === 'string') {
      return wrangle.normalize(wrangle.lines(input)); // Recursion 🌳
    }
    return [];
  },

  serialize(input: t.IgnoreInput) {
    const rules = wrangle.normalize(input);
    return `${rules.join('\n')}\n`;
  },

  async digest(input: t.IgnoreInput): Promise<t.StringHash> {
    const text = wrangle.serialize(input);
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    return `sha256-${hex}`;
  },

  rules(input: readonly string[]): t.IgnoreRule[] {
    return input.map((pattern) => wrangle.rule(pattern));
  },
} as const;
