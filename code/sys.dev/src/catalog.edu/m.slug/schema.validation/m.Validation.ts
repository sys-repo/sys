import type { t } from './common.ts';
import {
  attachSemanticRanges,
  semanticErrorsToDiagnostics,
  semanticErrorsToEditorDiagnostics,
  validateAliasRules,
  validatePropsShape,
  validateSlug,
  validateSlugAgainstRegistry,
  validateTraitExistence,
  validateWithRanges,
} from './mod.ts';

export const Validation: t.SlugValidationLib = {
  get validateTraitExistence() {
    return validateTraitExistence;
  },
  get validatePropsShape() {
    return validatePropsShape;
  },
  get validateSlug() {
    return validateSlug;
  },
  get validateSlugAgainstRegistry() {
    return validateSlugAgainstRegistry;
  },
  get validateWithRanges() {
    return validateWithRanges;
  },
  get attachSemanticRanges() {
    return attachSemanticRanges;
  },
  get semanticErrorsToDiagnostics() {
    return semanticErrorsToDiagnostics;
  },
  get semanticErrorsToEditorDiagnostics() {
    return semanticErrorsToEditorDiagnostics;
  },
  get validateAliasRules() {
    return validateAliasRules;
  },
};
