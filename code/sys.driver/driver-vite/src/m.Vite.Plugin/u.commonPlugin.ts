import { Style } from '@sys/ui-dom/style/react';
import reactPlugin from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import type { t } from './common.ts';
import { workspacePlugin } from './u.workspacePlugin.ts';

/**
 * A composite plugin that allow for a minimal configuration within `vite.config.ts`
 * that draws together
 *
 * - react-swc,
 * - emotion-style,
 * - and deno-workspace support.
 */
export const commonPlugin: t.VitePluginLib['common'] = async (options = {}) => {
  const plugins: t.VitePluginOption[] = [];

  // WASM support.
  if (options.wasm) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    plugins.push(wasm());
  }

  // React (via the SWC compiler).
  //   https://github.com/vitejs/vite-plugin-react-swc
  //   https://swc.rs/
  if (options.react ?? true) {
    const css = Style.plugin.emotion();
    plugins.push(reactPlugin(css));
  }

  // Deno workspace ("import" aliases).
  if (options.workspace !== false) {
    const op = options.workspace;
    const ws = await workspacePlugin(op === true ? {} : op);
    plugins.push(ws);
  }

  //   const plugin: t.CommonPlugin = {
  //     name: 'vite-plugin-common',
  //     info: { ws },
  //     config(config, env) {
  //       //
  //
  //       return config;
  //     },
  //   };

  return plugins;
};

// /**
//  * Helpers
//  */
// const wrangle = {
//   ws(input?: t.CommonPluginOptions) {
//     const op = input?.workspace;
//     if (op === false) return;
//     return workspacePlugin(op === true ? {} : op);
//   },
// } as const;
