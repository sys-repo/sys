import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return Vite.Config.app({
    input: '.tmp/sample/src/-test/index.html',
    outDir: '.tmp/sample/dist',
  });
});
