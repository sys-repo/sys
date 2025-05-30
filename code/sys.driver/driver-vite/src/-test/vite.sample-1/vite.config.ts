import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'npm:vite';

export default defineConfig(() =>
  Vite.Config.app({
    paths: Vite.Config.paths(),
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  }),
);
