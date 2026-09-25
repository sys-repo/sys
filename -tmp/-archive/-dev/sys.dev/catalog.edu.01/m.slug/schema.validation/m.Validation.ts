import type { t } from './common.ts';
import { SlugTree } from './m.SlugTree.ts';

import { semanticErrorsToDiagnostics, semanticErrorsToEditorDiagnostics } from './u.diagnostics.ts';
import { attachSemanticRanges } from './u.ranges.attach.ts';
import { validateWithRanges } from './u.ranges.validate.ts';
import { validateTraitExistence } from './u.trait.existence.ts';
import { validateAliasRules, validatePropsShape } from './u.trait.props.ts';
import { validateSlug, validateSlugAgainstRegistry } from './u.traits.ts';

export const Validation: t.SlugValidationLib = {
  SlugTree,
  validateTraitExistence,
  validatePropsShape,
  validateSlug,
  validateSlugAgainstRegistry,
  validateWithRanges,
  attachSemanticRanges,
  semanticErrorsToDiagnostics,
  semanticErrorsToEditorDiagnostics,
  validateAliasRules,
};
