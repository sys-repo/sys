import { Style } from '@sys/ui-dom/style/react';
import { defineConfig, type UserConfig } from 'vite';

import { workspacePlugin } from '@sys/driver-vite';
import reactPlugin from '@vitejs/plugin-react-swc';

/**
 * Vite "common" setup.
 * Sample of the plugins applied via:
 *
 *    import { Vite } from '@sys/driver-vite';
 *    Vite.Plugin.common();
 */
export default defineConfig(async () => {
  const react = reactPlugin(Style.plugin.emotion());
  const workspace = await workspacePlugin();

  // workspace.ws?.log({}); // 🐷

  return { plugins: [react, workspace] } as UserConfig;
});
