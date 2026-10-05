import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => {
  const entry = './src/ui.react.devharness/index.html';
  const paths = Vite.Config.paths({ app: { entry } });
  return Vite.Config.app({
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  });
});
