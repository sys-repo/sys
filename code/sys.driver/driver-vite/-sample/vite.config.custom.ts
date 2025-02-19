// deno-lint-ignore-file no-unreachable
import { Vite } from '@sys/driver-vite';

import { defineConfig } from 'vite';

/**
 * SAMPLE: Custom plugin (no customization).
 */
export default defineConfig(async () => {
  const app = await Vite.Config.app({
    input: '.tmp/sample/src/-test/index.html',
    outDir: '.tmp/sample/dist',

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

    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
    },

    minify: true, //                         ← (default)
    plugins: { react: true, wasm: true }, // ← (default)
  });

  return app;
});
