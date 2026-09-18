/**
 * @module
 * YAML parsing, serialization, AST inspection, and config-file helpers.
 *
 * ```ts
 * import { Yaml } from 'jsr:@sys/yaml';
 *
 * const parsed = Yaml.parse<{ name: string }>('name: sys');
 * ```
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library (core):
 */
export { Yaml } from './-exports/-core.ts';
