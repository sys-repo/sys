import { Pkg } from '../../mod.ts';
import { Foo } from '@sys/tmp/client/ui';

console.info('Pkg', Pkg);

/**
 * Sample: render react component.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <div>
      <div>{`Hello World 👋`}</div>
      <Foo />
    </div>
  </StrictMode>,
);
