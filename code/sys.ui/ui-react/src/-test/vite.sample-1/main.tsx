import { default as Pkg } from '../../../deno.json' with { type: 'json' };
import './-sample-imports.ts'; // 🐷

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';

console.info('Pkg', Pkg);
document.title = Pkg.name;


// import { Dev } from '../../ui/m.Dev.Harness/mod.ts';
import { DevHarness } from '../../ui/m.Dev/mod.ts';

/**
 * Entry Point.
*/
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App style={{border: `solid 1px blue`, color: 'blue',}}/>
    <DevHarness/>
  </StrictMode>,
);
