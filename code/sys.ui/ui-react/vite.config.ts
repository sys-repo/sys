import { defineConfig } from 'npm:vite';
import reactPlugin from 'npm:vite-plugin-react-swc';

import { Path } from '@sys/std';
import 'react';
import 'react-dom';

export default defineConfig({
  plugins: [reactPlugin()],
  server: { fs: { allow: ['..'] } },
  resolve: {
    alias: {
      '@my-module/foo': Path.resolve('../ui-tmp/src/ui/Components.tsx'),
    },
  },
});
