import { Vite } from '@sys/driver-vite';

const workspace = `${import.meta.dirname ?? '.'}/deno.json`;

export default Vite.Config.define(async () =>
  await Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './index.html' } }),
    plugins: { react: false },
    workspace,
  })
);
