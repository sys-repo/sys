import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => {
  return Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './src/ui/index.html' } }),
  });
});
