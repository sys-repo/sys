import type { t } from './common.ts';

/**
 * An <Info> object for working with a Deno workspace.
 */
export type DenoWorkspace = {
  readonly exists: boolean;
  readonly dir: t.StringPath;
  readonly file: t.StringPath;
  readonly children: t.DenoWorkspaceChild[];
  readonly modules: t.EsmModules;
};

/**
 * Represents a single child of a workspace.
 */
export type DenoWorkspaceChild = {
  readonly path: { readonly dir: t.StringDir; readonly denofile: t.StringPath };
  readonly denofile: t.DenoFileJson;
  readonly pkg: t.Pkg;
};
