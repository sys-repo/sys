import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { View } from '../ui.tsx';

/**
 * Test imports from across the workspace.
 */
import '@sys/driver-vite/sample-imports';

/**
 * Sample: dynamic import (code-splitting).
 */
const dynamic = import('../m.foo.ts');
dynamic.then((mod) => console.info('💦 dynmaic import', mod));

/**
 * Sample: render react component.
 */
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <View style={{ border: `solid 1px blue` }} />
  </StrictMode>,
);
