// deno-lint-ignore-file no-unreachable
import { workspacePlugin } from '@sys/driver-vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

import { c } from '@sys/std-s';
import { Style } from '@sys/ui-dom/style/react';

import topLevelAwait from 'vite-plugin-top-level-await';
// import wasm from 'vite-plugin-wasm';

/**
 * SAMPLE: Custom plugin (no customization).
 */
export default defineConfig(async (_ctx) => {
  const ws = await workspacePlugin({
    /**
     * ƒ(🌳): Filter to apply to the workspace modules
     *       (default: nothing filtered → ie. the entire monorepo is available for `import`).
     */
    filter(e) {
      return true;

      if (e.subpath.startsWith('/client')) return true;
      if (e.pkg === '@sys/std') return true;
      return false;
    },

    /**
     * ƒ(🌳): Callback to mutate the generated Vite configuration before
     *        it is passed on to the next step in the bundle pipeline
     */
    mutate(e) {
      console.info(c.dim(`\n👋 (callback inside plugin)`));
      if (e.ws) console.info(e.ws.toString({ pad: true }));
    },
  });

  const react = reactPlugin(Style.plugin.emotion());

  return {
    plugins: [topLevelAwait(), react, ws],
  };
});
