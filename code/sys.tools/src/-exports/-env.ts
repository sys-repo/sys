/**
 * @module
 * Runtime environment setup and initializers.
 */
export type EnvOptions = {
  vscode?: boolean;
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
if (import.meta.main) {
  await env({ silent: false });
}
