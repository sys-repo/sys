import { pkg } from '../common.ts';

/**
 * Render UI.
 */
globalThis.document.title = pkg.name;
console.log('🐷 entry.tsx', pkg);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { View } from './entry.sample.tsx';

console.info('Pkg', pkg);

/**
 * 🐷 Test imports from across the workspace.
 */
import '@sys/tmp/sample-imports';

/**
 * Sample: render react component.
 */
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <View style={{ border: `solid 1px blue` }} />
  </StrictMode>,
);
