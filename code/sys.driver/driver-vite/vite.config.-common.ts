// deno-lint-ignore-file no-unreachable
import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

import { c } from '@sys/std-s';

/**
 * SAMPLE: Custom plugin (no customization).
 */
export default defineConfig(() => {
  return Vite.Plugin.common({
    react: true, // ← (default)
    wasm: true, //  ← (default)

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
});
