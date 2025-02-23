import { pkg } from '../common.ts';

/**
 * Render UI.
 */
globalThis.document.title = pkg.name;
console.info('🐷 ./entry.tsx → Pkg:💦', pkg);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FooSample } from './-sample/ui.Foo.tsx';

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
    <FooSample style={{ border: `solid 1px blue` }} />
  </StrictMode>,
);
