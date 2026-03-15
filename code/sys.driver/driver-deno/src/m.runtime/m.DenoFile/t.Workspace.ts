import type { t } from './common.ts';

/**
 * An <Info> object for working with a Deno workspace.
 */
export type DenoWorkspace = {
  /** Whether the resolved file declared a workspace. */
  readonly exists: boolean;
  /** Workspace root directory. */
  readonly dir: t.StringPath;
  /** Workspace `deno.json` file path. */
  readonly file: t.StringPath;
  /** Loaded child workspace entries. */
  readonly children: t.DenoWorkspaceChild[];
  /** JSR module specifiers derived from named child packages. */
  readonly modules: t.EsmModules;
};

/**
 * Represents a single child of a workspace.
 */
export type DenoWorkspaceChild = {
  /** Relative child paths within the workspace. */
  readonly path: { readonly dir: t.StringDir; readonly denofile: t.StringPath };
  /** Parsed child `deno.json` contents. */
  readonly denofile: t.DenoFileJson;
  /** Derived package identity for the child. */
  readonly pkg: t.Pkg;
};
