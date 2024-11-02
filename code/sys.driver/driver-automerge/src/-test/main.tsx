import { Pkg } from '@sys/std';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../pkg.ts';

console.info('Pkg', pkg);
globalThis.document.title = Pkg.toString(pkg);

const el = <div>🐷 TODO: load `automerge` and test Vite/WASM support.</div>;

const root = createRoot(document.getElementById('root'));
root.render(<StrictMode>{el}</StrictMode>);
