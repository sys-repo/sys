import { Vite } from 'jsr:@sys/driver-vite@0.0.294';
import { defineConfig } from 'npm:vite';

const cwd = import.meta.dirname ?? '.';
const paths = Vite.Config.paths({
  cwd,
  app: { entry: 'index.html' },
});

export default defineConfig(() =>
  Vite.Config.app({
    paths,
    plugins: { react: false },
    workspace: `${cwd}/deno.json`,
  })
);
