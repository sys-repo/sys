/**
 * @module
 * Universal predicates extended with Deno and Node identity classifiers from `node:util.types`.
 *
 * Evaluating this module captures the host classifier functions. Each must still be the original
 * host function at that moment. Later replacement of properties on `node:util.types` cannot
 * redirect the exported host predicates.
 *
 * A host-classifier match reports only the identity recognized by the captured function, not
 * ownership or safety for later operations.
 *
 * The `@sys/std/is/server` entrypoint is limited to Deno and Node; use `@sys/std/is` for the
 * universal surface.
 */
export { Is } from '../m.Is.Server/mod.ts';
