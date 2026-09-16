import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => {
  return Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './ui/index.html' } }),
  });
});
