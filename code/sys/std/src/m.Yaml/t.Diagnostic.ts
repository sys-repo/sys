import type { t } from './common.ts';

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
};
