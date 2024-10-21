import { createRoot } from 'react-dom/client';
import { Pkg } from '../pkg.ts';
import { View } from './ui.tsx';

console.info('Pkg', Pkg);

/**
 * Test imports from across the workspace.
 */
import '../-sample-imports.ts';

/**
 * Sample: dynamic import (code-splitting).
 */
const dynamic = import('./m.foo.ts');
dynamic.then((mod) => console.log('💦 dynmaic import', mod));

/**
 * Sample: render react component.
 */
const root = createRoot(document.getElementById('root'));
root.render(<View style={{ border: `solid 1px blue` }} />);
