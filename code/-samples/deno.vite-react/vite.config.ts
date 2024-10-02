import { defineConfig } from 'vite';
import react from 'npm:@vitejs/plugin-react-swc@^3.5.0';

import 'react';
import 'react-dom';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});
