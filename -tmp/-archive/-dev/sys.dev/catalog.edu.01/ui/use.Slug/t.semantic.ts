import type { t } from './common.ts';

/**
 * Hook to compute *semantic* diagnostics for a Slug at a given YAML path.
 * - Assumes structural/schema validation is handled elsewhere.
 * - Uses the trait registry (defaults to the Catalog’s default registry).
 */
export type UseSlugSemanticDiagnostics = (args: {
  /** Current YAML editor snapshot (with AST + revision). */
  readonly yaml?: t.EditorYaml;

  /** Object path within the YAML (array or RFC6901 pointer string). */
  readonly path?: t.ObjectPath | string;

  /**
   * Trait registry used for semantic validation.
   * If omitted, the default catalog registry is used.
   */
  readonly registry?: t.SlugTraitRegistry;
}) => UseSlugSemanticDiagnosticsResult;

/**
 * Result returned by {@link UseSlugSemanticDiagnostics}.
 */
export type UseSlugSemanticDiagnosticsResult = {
  /** Revision number from the current editor state. */
  readonly rev: number;

  /**
   * Normalized diagnostics (semantic only).
   * - When structural parsing fails, this hook returns `[]` to avoid duplicate noise.
   */
  readonly diagnostics: t.Yaml.Diagnostic[];
};
