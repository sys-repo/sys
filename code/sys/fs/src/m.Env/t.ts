/**
 * Helpers for retrieveing environment variables (aka. "secrets").
 */
export type EnvLib = {
  /**
   * Creates a reader for accessing env-vars.
   */
  load(): Promise<Env>;
};

/**
 * Reads env-vars from either a [.env] file if present or
 * directly from the running process via [Deno.env].
 */
export type Env = {
  get(key: string): string;
};
