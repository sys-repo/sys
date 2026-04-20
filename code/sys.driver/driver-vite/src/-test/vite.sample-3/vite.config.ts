import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'npm:vite';

/**
 * Sample: with service-worker.
 */
export default defineConfig(async () => {
  const entry = './index.html';
  const sw = './sw.ts';
  const paths = Vite.Config.paths({ app: { entry, sw } });
  return await Vite.Config.app({
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  });
});
