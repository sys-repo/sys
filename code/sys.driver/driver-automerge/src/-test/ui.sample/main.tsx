import { Pkg } from '@sys/std';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../../pkg.ts';
import { App } from './App.tsx';

console.info('Pkg', pkg);
globalThis.document.title = Pkg.toString(pkg);

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
