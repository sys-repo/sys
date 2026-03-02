import deno from 'npm:@deno/vite-plugin';
import { defineConfig } from 'npm:vite';

export default defineConfig({
  plugins: [
    {
      name: 'sample:rewrite',
      enforce: 'pre',
      resolveId(source) {
        if (source === '@sys/http/client') return 'jsr:@sys/http@0.0.210/client';
        return null;
      },
    },
    deno(),
  ],
  build: { outDir: 'dist' },
});
