/**
 * @module
 * Environment setup and initializers.
 */

/**
 * Initialize deno for VSCode if running in a terminal, within VSCode.
 */
if (import.meta.main) {
  const { Env } = await import('@sys/fs/env');
  await Env.init({ silent: true });
}
