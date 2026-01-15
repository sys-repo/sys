/**
 * @module
 * Slug Compiler
 *
 * Authoritative tooling for interpreting, validating, and normalizing
 * Slug DSL artifacts into executable forms.
 *
 * Provides:
 * - Static diagnostics (linting, invariants)
 * - Resolution and normalization of Slug structures
 * - Task orchestration over Slug artifacts
 *
 * UI-agnostic. Deployment-agnostic.
 */
export { Linter } from './lint/mod.ts';
export { Tasks } from './tasks/mod.ts';
export { Slug } from './slug/mod.ts';
export { SlugTree } from './slug.SlugTree/mod.ts';
