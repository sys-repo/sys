import { pkg } from '../common.ts';

/**
 * Render UI.
 */
globalThis.document.title = pkg.name;
console.log('🐷 entry.tsx', pkg);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FooComponent } from './entry.Foo.tsx';

console.info('Pkg:💦', pkg);

/**
 * 🐷 Test " @sys " module imports from across the
 *    namespace (monorepo/workspace).
 */
import '@sys/tmp/sample-imports';

/**
 * Sample: render react component.
 */
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <FooComponent style={{ border: `solid 1px blue` }} />
  </StrictMode>,
);
