/**
 * @module Schema-Validation
 * Higher-order semantic validators layered on top of structural slug schemas.
 */
export { semanticErrorsToDiagnostics, semanticErrorsToEditorDiagnostics } from './u.diagnostics.ts';
export { attachSemanticRanges } from './u.ranges.attach.ts';
export { validateWithRanges } from './u.ranges.validate.ts';
export { validateTraitExistence } from './u.trait.existence.ts';
export { validateAliasRules, validatePropsShape } from './u.trait.props.ts';
export { validateSlug, validateSlugAgainstRegistry } from './u.traits.ts';

export { Validation } from './m.Validation.ts';
