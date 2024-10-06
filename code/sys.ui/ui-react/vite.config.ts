import reactPlugin from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

import { workspacePlugin } from '@sys/driver-vite';
import { Css } from '@sys/ui-react';

/**
 * Vite setup.
 */
export default defineConfig(async (_ctx) => {
  const workspace = await workspacePlugin();

  // workspace.ws?.log({}); 🐷

  const react = reactPlugin(Css.pluginOptions());
  return { plugins: [react, workspace] };
});
