import { Vite } from 'jsr:@sys/driver-vite@0.0.385';
import { defineConfig } from 'npm:vite';

const workspace = `${import.meta.dirname ?? '.'}/deno.json`;

export default defineConfig(async () =>
  await Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './index.html' } }),
    plugins: { react: false },
    workspace,
  })
);
