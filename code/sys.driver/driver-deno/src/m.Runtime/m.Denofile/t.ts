import type { t } from '../common.ts';

/**
 * Library: `deno.json` file tools.
 */
export type DenofileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  load(path?: t.DenofilePath): Promise<t.DenofileLoadResponse>;

  /**
   * Load a deno workspace.
   */
  workspace(src?: t.StringPath, options?: { walkup?: boolean }): Promise<t.DenoWorkspace>;

  /**
   * Determine if the given input is a `deno.json` file
   * that contains a "workspace":[] configuration.
   */
  isWorkspace(src?: t.StringPath): Promise<boolean>;
};

/** The async response from a `deno.json` file load request. */
export type DenofileLoadResponse = t.FsReadJsonResponse<t.DenofileJson>;

/**
 * A file-path to a `deno.json` file.
 */
export type DenofilePath = t.StringPath;

/**
 * A parsed `deno.json` file.
 */
export type DenofileJson = {
  name?: string;
  version?: string;
  licence?: string;
  tasks?: Record<string, string>;
  importMap?: t.StringPath;
  imports?: Record<string, string>;
  exports?: Record<string, string>;
  workspace?: t.StringPath[];
};

/**
 * An <Info> object for working with a Deno workspace.
 */
export type DenoWorkspace = {
  readonly exists: boolean;
  readonly dir: t.StringPath;
  readonly file: t.StringPath;
  readonly children: t.DenoWorkspaceChildren;
};

export type DenoWorkspaceChildren = {
  readonly dirs: t.StringDir[];
  load(): Promise<t.DenofileLoadResponse[]>;
};
