import type { t } from './common.ts';

/**
 * An <Info> object for working with a Deno workspace.
 */
export type DenoWorkspace = {
  readonly exists: boolean;
  readonly dir: t.StringPath;
  readonly file: t.StringPath;
  readonly children: t.DenoWorkspaceChildren;
  readonly modules: t.EsmModules;
};

/**
 *  The child projects within a workspace.
 */
export type DenoWorkspaceChildren = {
  readonly dirs: t.StringDir[];
  readonly files: t.DenoWorkspaceChild[];
};

/**
 * Represents a single child of a workspace.
 */
export type DenoWorkspaceChild = {
  readonly file: t.DenoFileJson;
  readonly path: t.StringPath;
};
