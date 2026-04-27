import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'npm:vite';
import { stripeDevRuntime } from './vite.config.fixture.dev.ts';

export default defineConfig(() => {
  const entry = './src/index.html';
  const sw = './src/-test/-sw.ts';
  const paths = Vite.Config.paths({ app: { entry, sw } });

  return Vite.Config.app({
    paths,
    visualizer: false,
    vitePlugins: [stripeDevRuntime()],
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', '@sys/std');
      e.chunk('css', '@sys/ui-css');
    },
  });
});
