import { ViteConfig } from '@sys/driver-vite/config';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const entry = './src/index.html';
  const sw = './src/-test/-sw.ts';
  const paths = ViteConfig.paths({ app: { entry, sw } });
  return ViteConfig.app({
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
      e.chunk('css', ['@sys/ui-css']);
    },
  });
});
