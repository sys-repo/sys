import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export const paths = Vite.Config.paths({
  cwd: import.meta.url,
  app: { entry: 'src/-entry/index.html' },
});

export default defineConfig(() => Vite.Config.app({ paths }));
