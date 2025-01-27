import type { t } from './common.ts';

import { Style } from '@sys/ui-css/react';
import reactPlugin from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { workspacePlugin } from './u.workspacePlugin.ts';

/**
 * A composite plugin that allow for a minimal configuration
 * within `vite.config.ts` that draws together
 *
 *  - the deno-workspace (as the base), and then optionally
 *  - react (with `emotion-style` and the `swc` compiler)
 *  - wasm
 */
export const commonPlugins: t.VitePluginLib['common'] = async (options = {}) => {
  const plugins: t.VitePluginOption[] = [];

  // Root workspace and build configuration.
  // NB: The default build options are configrued within
  //     the workspace plugin.
  if (options.workspace ?? true) {
    const ws = await workspacePlugin(options);
    plugins.push(ws);
  }

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
    const css = Style.plugin.emotion();
    plugins.push(reactPlugin(css) as any);
  }

  // Finish up.
  return { plugins };
};
