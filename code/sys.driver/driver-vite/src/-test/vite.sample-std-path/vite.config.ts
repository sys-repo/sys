import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(async () =>
  await Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './index.html' } }),
  }),
);
