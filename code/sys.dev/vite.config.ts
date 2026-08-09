import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => {
  const entry = './src/index.html';
  const sw = './src/-test/-sw.ts';
  const paths = Vite.Config.paths({ app: { entry, sw } });
  return Vite.Config.app({
    paths,
    visualizer: false,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', '@sys/std');
      e.chunk('yaml', 'yaml');
      e.chunk('crdt', '@sys/driver-automerge');
      e.chunk('svg', '@svgdotjs/svg.js');
      e.chunk('typebox', 'typebox');
      e.chunk('motion', 'motion');
    },
  });
});
