import type { t } from '../common.ts';

/**
 * Functions for validating slug-tree structures (semantic layer).
 */
export type SlugTreeValidationLib = {
  validateWithRanges: (args: {
    ast: t.Yaml.Ast;
    tree: unknown;
    registry: t.SlugTraitRegistry;
    basePath?: t.ObjectPath;
    severity?: t.DiagnosticSeverity;
  }) => t.EditorDiagnostic[];
};
