// deno-lint-ignore-file no-unreachable
import { c } from '@sys/cli';
import { Vite } from '@sys/driver-vite';

import { defineConfig, type UserConfig } from 'vite';
import { pkg, Path } from '../src/common.ts';

/**
 * SAMPLE: Custom plugin (no customization).
 */
export default defineConfig(async () => {
  console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔`);

  const __dirname = Path.fromFileUrl(import.meta.url);
  console.log('__dirname', __dirname);

  const { plugins } = await Vite.Plugin.common({
    pkg,
    react: true, // ← (default)
    wasm: true, //  ← (default)
    // workspace: false,

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
      // if (e.ws) console.info(e.ws.toString({ pad: true }));
    },

    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
    },
  });

  const libEntry = Path.join(__dirname, '../src/-entry/-lib.ts');
  console.log('p', libEntry);

  const build: UserConfig['build'] = {
  };

  const res: UserConfig = {
    plugins,
    // build,
  };

  return res;
});
