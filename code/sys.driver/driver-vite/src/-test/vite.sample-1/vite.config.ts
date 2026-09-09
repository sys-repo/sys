import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(async () =>
  await Vite.Config.app({
    paths: Vite.Config.paths(),
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
    },
  }),
);
