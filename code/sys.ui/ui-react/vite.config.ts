import { ViteProcess } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import reactPlugin from 'vite-plugin-react-swc';

export default defineConfig((_ctx) => {
  return {
    plugins: [reactPlugin(), ViteProcess.workspacePlugin()],
  };
});
