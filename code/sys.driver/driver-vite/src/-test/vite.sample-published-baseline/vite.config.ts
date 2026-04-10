import { Vite } from 'jsr:@sys/driver-vite@0.0.353';
import { defineConfig } from 'npm:vite';

const workspace = `${import.meta.dirname ?? '.'}/deno.json`;

export default defineConfig(() =>
  Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './index.html' } }),
    plugins: { react: false },
    workspace,
  })
);
