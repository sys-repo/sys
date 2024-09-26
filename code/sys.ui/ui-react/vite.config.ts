import { defineConfig } from 'npm:vite';
import react from 'npm:vite-plugin-react-swc';

import 'react';
import 'react-dom';

export default defineConfig({ plugins: [react()] });
