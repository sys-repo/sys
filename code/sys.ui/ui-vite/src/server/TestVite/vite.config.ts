import type { t } from './common.ts';

import { defineConfig } from 'npm:vite';
import reactPlugin from 'npm:vite-plugin-react-swc';
import { defineHandler } from './TestVite.config.ts';

export default defineConfig((ctx) => {
  const res: t.ViteUserConfig = {
    plugins: [],
    build: { rollupOptions: {} },
  };
  defineHandler(ctx, res);
  res.plugins!.unshift(reactPlugin());
  return res;
});
