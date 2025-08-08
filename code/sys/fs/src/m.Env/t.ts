import { type t } from './common.ts';

/**
 * Helpers for retrieveing environment variables (aka. "secrets").
 */
export type EnvLib = Readonly<{
  Is: t.EnvIsLib;

  /** Creates a reader for accessing env-vars. */
  load(): Promise<Env>;

  /** Initializes for known environments (eg. "VSCode"). */
  init(): Promise<void>;
}>;

/**
 * Reads env-vars from either a [.env] file if present or
 * directly from the running process via [Deno.env].
 */
export type Env = {
  get(key: string): string;
};

/**
 * Boolean evaluators for environment conditions.
 */
export type EnvIsLib = Readonly<{
  vscode: boolean;
}>;
