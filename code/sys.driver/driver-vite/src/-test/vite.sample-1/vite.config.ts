import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export const paths = Vite.Config.paths(import.meta.url);

export default defineConfig(() =>
  Vite.Config.app({
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  }),
);
