/**
 * @module Environment setup and initializers.
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
  const vscode = options.vscode ?? true;
  const silent = options.silent ?? true;

  if (!vscode) return;

  const { Env } = await import('@sys/fs/env');
  await Env.init({ silent });
}
