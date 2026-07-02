import { Vite } from 'jsr:@sys/driver-vite@0.0.445';

const workspace = `${import.meta.dirname ?? '.'}/deno.json`;

export default Vite.Config.define(async () =>
  await Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './index.html' } }),
    plugins: { react: false },
    workspace,
  })
);
