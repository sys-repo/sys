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
/** Lint helpers for slug documents. */
export { Linter } from './m.lint/mod.ts';
/** Task orchestration utilities for slug builds. */
export { Tasks } from './m.tasks/mod.ts';
/** Slug language utilities. */
export { Slug } from './m.slug/mod.ts';
/** Tree-builder helpers derived from slug structures. */
export { SlugTree } from './m.slug.SlugTree/mod.ts';
/** Bundling helpers for slug artifacts. */
export { Bundler } from './m.bundle/mod.ts';
