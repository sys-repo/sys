import { ViteProcess } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import reactPlugin from 'vite-plugin-react-swc';

export default defineConfig((_ctx) => {
  const workspace = ViteProcess.workspacePlugin({
    filter: (e) => e.subpath.startsWith('/client'),
  });
  return {
    plugins: [reactPlugin(), workspace],
  };
});
