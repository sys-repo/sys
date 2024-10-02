import { ViteProcess } from '@sys/driver-vite';
import { defineConfig } from 'npm:vite';
import reactPlugin from 'npm:vite-plugin-react-swc';

export default defineConfig((_ctx) => {
  return {
    plugins: [reactPlugin(), ViteProcess.plugin()],
  };
});
