import type { t } from '../common.ts';

/**
 * Functions for validating slug YAML (semantic layer).
 */
export type SlugValidationLib = {
  validateTraitExistence: (input: t.SlugValidateInput) => t.Schema.ValidationError[];
  validateAliasRules: (input: t.SlugValidateInput) => t.Schema.ValidationError[];
  validatePropsShape: (input: t.SlugValidateInput) => t.Schema.ValidationError[];

  validateSlugAgainstRegistry: (input: t.SlugValidateInput) => t.Schema.ValidationError[];
  validateSlug: (input: t.SlugValidateInput) => t.SlugValidateResult;

  validateWithRanges: (args: {
    ast: t.Yaml.Ast;
    slug: unknown;
    registry: t.SlugTraitRegistry;
    basePath?: t.ObjectPath;
  }) => t.Schema.ValidationError[];

  attachSemanticRanges: (
    ast: t.Yaml.Ast,
    errs: t.Schema.ValidationError[],
    opts?: { basePath?: t.ObjectPath },
  ) => void;

  semanticErrorsToDiagnostics: (errors: t.Schema.ValidationError[]) => t.Yaml.Diagnostic[];
  semanticErrorsToEditorDiagnostics: (
    errors: t.Schema.ValidationError[],
    opts?: { severity?: t.DiagnosticSeverity },
  ) => t.EditorDiagnostic[];
};

/**
 * Semantic error keywords for slug→registry validation.
 */
export type SlugSemanticKeyword =
  | 'semantic/duplicate-alias'
  | 'semantic/unknown-trait'
  | 'semantic/missing-props'
  | 'semantic/orphan-props'
  | 'semantic/invalid-props';

/**
 * Input to the semantic validator.
 */
export type SlugValidateInput = {
  /** Parsed slug object (structurally valid but not yet semantically checked). */
  readonly slug: unknown;
  /** Trait registry used to resolve and validate trait definitions. */
  readonly registry: t.SlugTraitRegistry;
  /** Optional base path (for mapping validation errors to editor-relative locations). */
  readonly basePath?: t.ObjectPath;
};

/**
 * Result wrapper (optional convenience).
 */
export type SlugValidateResult = {
  readonly valid: boolean;
  readonly errors: readonly t.Schema.ValidationError[];
};

export type SlugTraitAliasIndex = {
  readonly byAlias: Map<string, number[]>; // alias -> indices
  readonly aliases: string[];
};
