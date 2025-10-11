/**
 * @module Schema-Validation
 * Higher-order semantic validators layered on top of structural slug schemas.
 */
export { attachSemanticRanges } from './u.ranges.attach.ts';
export { validateWithRanges } from './u.ranges.validate.ts';
export { semanticErrorsToEditorDiagnostics } from './u.toDiagnostics.editor.ts';
export { semanticErrorsToDiagnostics } from './u.toDiagnostics.ts';
export { validateTraitExistence } from './u.trait.existence.ts';
export { validateAliasRules, validatePropsShape } from './u.trait.props.ts';
export { validateSlug, validateSlugAgainstRegistry } from './u.traits.ts';
