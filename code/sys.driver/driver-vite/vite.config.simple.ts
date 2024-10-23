import reactPlugin from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

import { workspacePlugin } from '@sys/driver-vite';
import { Style } from '@sys/ui-dom/style/react';

/**
 * SAMPLE: Simple default (no customization).
 */
export default defineConfig((_ctx) => {
  const react = reactPlugin(Style.plugin.emotion());
  const ws = workspacePlugin();
  return { plugins: [react, ws] };
});
