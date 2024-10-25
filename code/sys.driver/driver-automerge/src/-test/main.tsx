import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Pkg } from '../pkg.ts';

console.info('Pkg', Pkg);
globalThis.document.title = `${Pkg.name}@${Pkg.version}`;

// console.log('foo');

const el = <div>🐷 TODO: load `automerge` and test Vite/WASM support.</div>;

const root = createRoot(document.getElementById('root'));
root.render(<StrictMode>{el}</StrictMode>);
