import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import { pkg } from './src/pkg.ts';

/**
 * Vite "common" setup.
 */
export default defineConfig(() => {
  return Vite.Plugin.common({ pkg });
});
