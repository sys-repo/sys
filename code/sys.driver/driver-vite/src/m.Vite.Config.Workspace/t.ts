import type { t } from './common.ts';

type ToStringOptions = { pad?: boolean };

/**
 * Vite/Deno workspace helpers.
 */
export type ViteDenoWorkspace = t.DenoWorkspace & {
  /** List of known module-aliases derived from the Deno workspace. */
  readonly aliases: t.ViteAlias[];

  /**
   * Module filter used by the workspace (default: always returns true, not blocking).
   */
  readonly filter?: t.WorkspaceFilter;

  /** Convert the list of aliases into a flat map. */
  toAliasMap(): Record<string, t.StringPath>;

  /** Pretty string representation of the workspace. */
  toString(options?: ToStringOptions): string;

  /** Pass a toString() on the workspace directly into the log. */
  log(options?: ToStringOptions): void;
};

/**
 * Filter a workspace of modules.
 */
export type WorkspaceFilter = (e: t.WorkspaceFilterArgs) => boolean;
export type WorkspaceFilterArgs = {
  pkg: string;
  export: string;
  subpath: string;
};

/** Options from the {config.workspace} method. */
export type ViteConfigWorkspaceOptions = {
  denofile?: t.StringPath;
  walkup?: boolean;
  filter?: t.WorkspaceFilter;
};
