import type { t } from './common.ts';

/**
 * Helpers for normalizing YAML parser errors into standard diagnostics.
 *
 * These methods convert raw YAML parser errors (`t.Yaml.Error`)
 * into structured `t.Yaml.Diagnostic` objects suitable for use across
 * schema validation, UI markers, or CLI reporting pipelines.
 */
export type YamlDiagnosticLib = {
  /**
   * Convert a single YAML parser error into a normalized diagnostic.
   * - Coerces `code` to a string when numeric.
   * - Preserves `pos`, `linePos`, and `range` (coerced to valid tuple forms).
   * - Ensures minimal structural consistency across all YAML error sources.
   */
  fromYamlError(err: t.Yaml.Error): t.Yaml.Diagnostic;

  /**
   * Convert a list of YAML parser errors into normalized diagnostics.
   * - Returns `[]` if input is empty or not an array.
   * - Applies the same normalization as {@link fromYamlError} to each entry.
   */
  fromYamlErrors(list?: t.Yaml.Error[]): t.Yaml.Diagnostic[];
};

/**
 * Normalized YAML diagnostic.
 * - Unified representation for all YAML issues:
 *   - parser (syntax),
 *   - schema (structural),
 *   - semantic (logical).
 * - Portable across tools (Monaco, LSP, CLI).
 * - Suitable for visual markers, logs, and validation pipelines.
 */
export type YamlDiagnostic = {
  /** Human-readable description of the issue. */
  readonly message: string;

  /** Optional machine code or rule ID (e.g. 'slug/schema', 'slug/alias-duplicate'). */
  readonly code?: string;

  /**
   * Object path to the offending node (relative to YAML document root).
   * Used for correlating errors with schema fields or semantic locations.
   */
  readonly path?: t.ObjectPath;

  /**
   * Character range [start, end) within the YAML source.
   * Enables precise editor markers or highlighting.
   */
  readonly range?: t.Yaml.Range;

  /** Byte offsets. */
  readonly pos?: readonly [number, number]; //

  /** Line position. */
  readonly linePos?:
    | readonly [t.LinePos] //             single
    | readonly [t.LinePos, t.LinePos]; // pair
};
