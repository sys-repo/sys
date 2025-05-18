import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const entry = './src/-test/index.html';
  const paths = Vite.Config.paths({ app: { entry } });
  return Vite.Config.app({
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  });
});
