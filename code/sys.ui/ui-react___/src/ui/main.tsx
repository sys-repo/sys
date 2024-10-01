import React from 'react';
import { createRoot } from 'react-dom/client';

import { Pkg } from '../common.ts';

console.info(`Pkg:`, Pkg);

import App from './App.tsx';
import './main.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
