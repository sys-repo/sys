import type { t } from '../common.ts';

/**
 * Internal local `deno info --json` CLI boundary types.
 *
 * Keep raw Deno CLI shapes out of the public workspace graph contract.
 */
export declare namespace WorkspaceGraphCli {
  /** Arguments for the local `deno info --json` collection call. */
  export type InfoArgs = {
    /** Working directory for the CLI call. */
    readonly cwd: t.StringDir;
    /** Root entry module paths. */
    readonly roots: readonly t.StringPath[];
  };

  /** Prepared `deno info --json` invocation. */
  export type InfoCommand = {
    readonly cmd: string;
    readonly cwd: t.StringDir;
    readonly args: readonly string[];
  };

  /** Minimal raw JSON shape consumed by workspace normalization. */
  export type InfoJson = {
    readonly roots?: readonly string[];
    readonly modules?: readonly InfoModule[];
  };

  /** Raw module shape from `deno info --json`. */
  export type InfoModule = {
    readonly specifier?: string;
    readonly dependencies?: readonly InfoDependency[];
  };

  /** Raw dependency shape from `deno info --json`. */
  export type InfoDependency = {
    readonly code?: { readonly specifier?: string };
    readonly type?: { readonly specifier?: string };
  };
}
