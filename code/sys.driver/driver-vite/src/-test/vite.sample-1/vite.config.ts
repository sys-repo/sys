import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export default defineConfig(() =>
  Vite.Config.app({
    paths: Vite.Config.paths(import.meta.url),
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  }),
);
