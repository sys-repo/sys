import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'npm:vite';

const paths = Vite.Config.paths({
  app: { entry: 'index.html' },
});

export default defineConfig(() =>
  Vite.Config.app({
    paths,
    plugins: { react: false },
  })
);
