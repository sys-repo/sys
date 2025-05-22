import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import { pkg } from './src/pkg.ts';

/**
 * Vite "common" setup.
 */
export default defineConfig(() => {
  return Vite.Plugin.common({
    pkg,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
    },
  });
});
