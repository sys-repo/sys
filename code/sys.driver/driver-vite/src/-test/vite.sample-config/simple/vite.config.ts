import { Vite } from '@sys/driver-vite';

const paths = Vite.Config.paths({
  app: {
    entry: '.tmp/sample/src/index.html',
    outDir: '.tmp/sample/dist',
  },
});

export default Vite.Config.define(async () => await Vite.Config.app({ paths }));
