import { Vite } from '@sys/driver-vite';
import { vitePaths } from './-scripts/u.vite.paths.ts';

export default Vite.Config.define(() => {
  const paths = vitePaths(import.meta.dirname ?? '.');
  return Vite.Config.app({
    paths,
    visualizer: false,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', '@sys/std');
      e.chunk('css', '@sys/ui-css');
    },
  });
});
