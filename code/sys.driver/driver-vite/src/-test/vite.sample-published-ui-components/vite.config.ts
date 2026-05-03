import { Vite } from 'jsr:@sys/driver-vite@0.0.388';
import { defineConfig } from 'vite';

export default defineConfig(async () =>
  await Vite.Config.app({
    workspace: false,
    chunks(e) {
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', '@sys/std');
      e.chunk('css', '@sys/ui-css');
    },
  }),
);
