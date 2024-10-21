import { Pkg } from '../pkg.ts';
console.info('Pkg', Pkg);

/**
 * Sample: render react component.
 */
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<div>Hello World 👋</div>);
