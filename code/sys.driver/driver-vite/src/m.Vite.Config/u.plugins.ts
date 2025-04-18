import deno from '@deno/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';

import type { t } from './common.ts';

export async function commonPlugins(options: t.ViteConfigCommonPlugins = {}) {
  const plugins: t.VitePluginOption[] = [];

  /**
   * The official Deno™️ vite-plugin.
   */
  if (options.deno ?? true) {
    plugins.push(deno() as t.VitePlugin[]);
  }

  /**
   * WASM support.
   */
  if (options.wasm ?? true) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    plugins.push(wasm());
  }

  /**
   * React (via the SWC compiler).
   *  -  https://github.com/vitejs/vite-plugin-react-swc
   *  -  https://swc.rs
   */
  if (options.react ?? true) {
    plugins.push(react() as t.VitePluginOption[]);
  }

  // Finish up.
  return plugins;
}
