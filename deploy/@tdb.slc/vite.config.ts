import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'npm:vite';

export default defineConfig(() => {
  const entry = './src/-test/index.html';
  const sw = 'src/-test/-sw.ts';
  const paths = Vite.Config.paths({ app: { entry, sw } });
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
