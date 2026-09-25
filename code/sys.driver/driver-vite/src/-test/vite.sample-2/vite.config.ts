import { Vite } from '@sys/driver-vite';

export const paths = Vite.Config.paths({
  // cwd: import.meta.url,
  app: { entry: 'src/-entry/index.html' },
});

export default Vite.Config.define(async () => await Vite.Config.app({ paths }));
