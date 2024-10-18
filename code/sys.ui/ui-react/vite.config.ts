import reactPlugin from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

import { workspacePlugin } from '@sys/driver-vite';
import { Style } from './src/u/m.Style/mod.ts';

/**
 * Vite setup.
 */
export default defineConfig(async (_ctx) => {
  const workspace = await workspacePlugin();
  // workspace.ws?.log({}); // 🐷

  const react = reactPlugin(Style.plugin.emotion());
  return { plugins: [react, workspace] };
});
