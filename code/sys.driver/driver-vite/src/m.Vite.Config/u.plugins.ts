import type { t } from './common.ts';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import deno from 'npm:@deno/vite-plugin';

export async function commonPlugins(options: t.ViteConfigCommonPlugins = {}) {
  const plugins: t.VitePluginOption[] = [];

  /**
   * The official Deno vite-plugin:
   */
  if (options.deno ?? true) {
    plugins.push(deno() as t.VitePlugin[]);
  }

  /**
   * WASM support:
   */
  if (options.wasm ?? true) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    plugins.push(wasm());
  }

  /**
   * React:
   */
  if (options.react ?? true) {
    const exclude = [/(\.|^)worker\.tsx?$/];
    plugins.push(react({ exclude }));
  }

  // Finish up.
  return plugins;
}
