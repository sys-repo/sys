import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import { pkg } from './src/pkg.ts';

export default defineConfig(() => {
  return Vite.Config.app({
    pkg,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
    },
  });
});
