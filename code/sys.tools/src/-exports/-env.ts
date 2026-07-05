/**
 * @module
 * Runtime environment setup and initializers.
 */
/** Options for the `env` runtime initializer. */
export type EnvOptions = {
  /** Initialize VSCode terminal environment support. */
  vscode?: boolean;
  /** Suppress initializer output. */
  silent?: boolean;
};

/**
 * Ensure environment is initialized for the current runtime.
 * - If enabled, initializes Deno/FS environment for VSCode terminals.
 */
export async function env(options: EnvOptions = {}): Promise<void> {
  const { vscode = true, silent = true } = options;
  if (!vscode) return;

  const { Env } = await import('@sys/fs/env');
  await Env.init({ silent });
}

/**
 * CLI entry-point:
 */
if (import.meta.main) await env({ silent: false });
