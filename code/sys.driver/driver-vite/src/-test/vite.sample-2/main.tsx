import { Pkg } from '../pkg.ts';
console.info('Pkg', Pkg);

/**
 * Test imports from across the workspace.
 */
import '../-sample-imports.ts';

/**
 * Sample: dynamic import (code-splitting).
 */
const dynamic = import('./main.foo.ts');
dynamic.then((mod) => console.log('💦 dynmaic import', mod));

/**
 * Sample: internal monorepo import.
 */
import { Foo } from '@sys/tmp/client/ui'; // NB: imported from mono-repo, mapped in {resolve/alias} Vite config.

/**
 * Sample: render react component.
 */
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<Foo />);
