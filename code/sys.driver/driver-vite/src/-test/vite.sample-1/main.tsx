import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../../pkg.ts';
console.info('Pkg', pkg);

/**
 * Sample: render react component.
 */
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <div>Hello World 👋</div>
  </StrictMode>,
);
