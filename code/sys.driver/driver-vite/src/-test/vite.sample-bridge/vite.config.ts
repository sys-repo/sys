import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'npm:vite';

const workspace = `${import.meta.dirname ?? '.'}/deno.json`;

export default defineConfig(() =>
  Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './index.html' } }),
    plugins: { react: false },
    workspace,
  })
);
