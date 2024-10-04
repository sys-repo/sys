import { default as Pkg } from '../../../deno.json' with { type: 'json' };

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';

console.info('Pkg', Pkg);
document.title = Pkg.name;

/**
 * Entry Point.
*/
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App style={{border: `solid 1px blue`,}}/>
  </StrictMode>,
);
