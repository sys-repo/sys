import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import { pkg } from './src/pkg.ts';

export default defineConfig(() => {
  return Vite.Plugin.common({
    pkg,
    chunks(_e) {},
  });
});
