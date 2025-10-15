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
  validateTraitExistence,
  validateAliasRules,
  validatePropsShape,
  validateSlug,
  validateSlugAgainstRegistry,
  validateWithRanges,
  attachSemanticRanges,
  semanticErrorsToDiagnostics,
  semanticErrorsToEditorDiagnostics,
};
