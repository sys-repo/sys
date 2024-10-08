import { default as Pkg } from '../../../deno.json' with { type: 'json' };
console.info('Pkg', Pkg);

/**
 * Sample: import NPM module.
 */
import { Observable } from 'rxjs'; // NB: see monorepo import-map.
console.log('import rxjs: Observable', Observable);

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
