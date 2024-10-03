import reactPlugin from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

import { workspacePlugin } from '@sys/driver-vite';
import { Css } from '@sys/ui-react';

/**
 * Vite setup.
 */
export default defineConfig((_ctx) => {
  const workspace = workspacePlugin({ filter: (e) => e.subpath.startsWith('/client') });
  const react = reactPlugin({ ...Css.pluginOptions() });
  return { plugins: [react, workspace] };
});
