import { Vite } from 'jsr:@sys/driver-vite@0.0.348';
import { defineConfig } from 'vite';

export default defineConfig(() =>
  Vite.Config.app({
    workspace: false,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', '@sys/std');
      e.chunk('css', '@sys/ui-css');
    },
  }),
);
