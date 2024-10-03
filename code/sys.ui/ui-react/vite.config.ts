import { workspacePlugin } from '@sys/driver-vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig((_ctx) => {
  const workspace = workspacePlugin({ filter: (e) => e.subpath.startsWith('/client') });
  return {
    plugins: [reactPlugin(), workspace],
  };
});
