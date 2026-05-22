import type { t } from './common.ts';

/**
 * Hook for deriving structural diagnostics from YAML editor state.
 * - Parses the current YAML AST at the given `path`.
 * - Validates the structure of the `Slug` object.
 * - Returns a normalized set of diagnostics and revision tracking info.
 */
export type UseSlugStructuralDiagnostics = (args: {
  /** Current YAML editor snapshot. */
  readonly yaml?: t.EditorYaml;

  /** Optional path within the YAML to scope diagnostics to. */
  readonly path?: t.ObjectPath | string;

  /**
   * Trait registry used for semantic validation.
   * If omitted, the default catalog registry is used.
   */
  readonly registry?: t.SlugTraitRegistry;
}) => UseSlugStructuralDiagnosticsResult;

/**
 * Result returned by {@link UseSlugStructuralDiagnostics}.
 * Includes revision tracking, structural validation result, and diagnostics.
 */
export type UseSlugStructuralDiagnosticsResult = {
  /** True when the YAML structure is valid and no diagnostics were emitted. */
  readonly ok: boolean;

  /** Revision number from the current editor state. */
  readonly rev: number;

  /** Structural parse result of the YAML segment (if successful). */
  readonly result?: t.SlugFromYamlResult;

  /** Normalized structural diagnostics from the YAML pipeline. */
  readonly diagnostics: t.Yaml.Diagnostic[];
};
