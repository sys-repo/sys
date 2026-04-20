/**
 * @module
 * Workspace orchestration helpers for multi-package repositories.
 */
export { pkg } from './pkg.ts';
export { WorkspaceGraph } from './m.graph/mod.ts';
export { WorkspaceRun } from './m.run/mod.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { Workspace } from './mod.Workspace.ts';
