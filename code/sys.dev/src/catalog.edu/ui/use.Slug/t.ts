import type { t } from './common.ts';

export type * from './t.semantic.ts';
export type * from './t.structural.ts';

/**
 * Hook for deriving combined structural + semantic diagnostics for a slug.
 * - Parses the YAML at the given `path`.
 * - Runs structural (schema) and semantic (registry-aware) validation.
 * - Returns merged diagnostics and each sub-result for detailed UI use.
 */
export type UseSlugDiagnostics = (
  registry?: t.SlugTraitRegistry,
  path?: t.ObjectPath | string,
  yaml?: t.EditorYaml,
) => t.UseSlugDiagnosticsResult;

/**
 * Result of {@link useSlugDiagnostics}.
 * Merges structural and semantic diagnostics into a single editor-ready set.
 */
export type UseSlugDiagnosticsResult = {
  /** Revision (from editor state) */
  readonly rev: number;
  /** Merged diagnostics you can feed straight to Monaco’s hook */
  readonly diagnostics: t.Yaml.Diagnostic[];
  /** For inspection / UI splitting */
  readonly structural: t.UseSlugStructuralDiagnosticsResult;
  readonly semantic: t.UseSlugSemanticDiagnosticsResult;
};
