import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { type t } from './common.ts';

export async function commonPlugins(options: t.ViteConfigCommonPlugins = {}) {
  const plugins: t.VitePluginOption[] = [];

  // WASM support.
  if (options.wasm ?? true) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    plugins.push(wasm());
  }

  // React (via the SWC compiler).
  // -  https://github.com/vitejs/vite-plugin-react-swc
  // -  https://swc.rs
  if (options.react ?? true) {
    plugins.push(react() as any);
  }

  // Finish up.
  return plugins;
}
