import type { t } from './common.ts';

/**
 * Helpers for constructing YAML parser-style errors.
 *
 * These utilities create `t.Yaml.Error` objects that conform to the
 * upstream parser error shape, without relying on the parser itself.
 * Intended for synthetic or programmatic error generation.
 */
export type YamlErrorLib = {
  /**
   * Create a synthetic YAML parser error.
   *
   * - Produces a valid `t.Yaml.Error` object.
   * - `message` carries all human meaning.
   * - `code` and `name` exist only to satisfy the parser error shape.
   */
  synthetic(args: {
    /** Human-readable error message. */
    message: string;

    /** Optional character range `[start, end)`. */
    pos?: readonly [number, number];

    /** Optional error name override. */
    name?: t.Yaml.Error['name'];

    /** Optional parser error code override. */
    code?: t.Yaml.Error['code'];
  }): t.Yaml.Error;
};
