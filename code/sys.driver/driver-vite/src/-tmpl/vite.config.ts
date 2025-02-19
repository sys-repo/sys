import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return Vite.Config.app({
    input: 'src/-test/index.html',
    outDir: 'dist',
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
    },
  });
});
