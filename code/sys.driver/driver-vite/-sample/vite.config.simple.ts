import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import { pkg } from '../src/pkg.ts';

export default defineConfig(async () => {
  const plugins = await Vite.Plugin.common({ pkg, chunks(_e) {} });
  return { plugins };
});
