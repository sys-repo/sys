import { type t } from './common.ts';

/**
 * Helpers for retrieving environment variables (aka. "secrets").
 */
export type EnvLib = Readonly<{
  Is: t.EnvIsLib;

  /** Creates a reader for accessing env-vars. */
  load(options?: EnvLoadOptions): Promise<Env>;

  /** Initializes for known environments (eg. "VSCode"). */
  init(opts?: { silent?: boolean }): Promise<void>;
}>;

export type EnvLoadOptions = {
  /** Base directory for loading `.env` files (defaults to current working directory). */
  cwd?: t.StringDir;

  /** `.env` file lookup strategy. */
  search?: EnvLoadSearch;
};

export type EnvLoadSearch = 'cwd' | 'upward';

/**
 * Reads env-vars from either a [.env] file if present or
 * directly from the running process via [Deno.env].
 */
export type Env = {
  /** Resolve an env var value. Missing keys resolve to an empty string for backwards compatibility. */
  get(key: string): string;

  /** True when the key exists in loaded dotenv values or process env, including present-empty values. */
  has(key: string): boolean;
};

/**
 * Boolean evaluators for environment conditions.
 */
export type EnvIsLib = Readonly<{
  vscode: boolean;
}>;
