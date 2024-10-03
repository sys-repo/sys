import { default as Pkg } from '../../../deno.json' with { type: 'json' };
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
