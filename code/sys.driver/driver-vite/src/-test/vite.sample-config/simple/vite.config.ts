import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export const paths = Vite.Config.paths({
  app: {
    entry: '.tmp/sample/src/-test/index.html',
    outDir: '.tmp/sample/dist',
  },
});

export default defineConfig(() => Vite.Config.app({ paths }));
