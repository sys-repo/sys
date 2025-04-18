import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'npm:vite';

export default defineConfig(() => {
  const entry = './src/-test/index.html';
  const paths = Vite.Config.paths({ app: { entry } });
  return Vite.Config.app({
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
      e.chunk('css', ['@sys/ui-css']);
    },
  });
});
