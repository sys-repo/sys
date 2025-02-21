import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export const paths = Vite.Config.paths({
  app: { entry: './src/-test/index.html' },
});

export default defineConfig(() => {
  return Vite.Config.app({
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  });
});
