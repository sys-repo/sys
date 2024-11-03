import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { pkg } from '../common.ts';
import { Tmp } from '../mod.ts';

/**
 * Render UI.
 */
const document = globalThis.document;
document.title = pkg.name;
console.log('🐷 entry.tsx', pkg);

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <Tmp />
  </StrictMode>,
);
