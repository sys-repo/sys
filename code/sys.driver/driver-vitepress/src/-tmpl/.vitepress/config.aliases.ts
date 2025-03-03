import { ViteConfig } from '@sys/driver-vite';

/**
 * Generate "import" statement alias map for:
 *
 *    - jsr:@sys         System modules within the workspace.
 *    - npm:<deps>       The upstream dependencies imported from the NPM registry.
 */
export async function getAliases() {
  const ws = await ViteConfig.workspace();
  return ws.aliases;
}
