import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
worker.addEventListener('message', (event) => console.info('🐷[worker]', event.data));
void import('./dynamic.ts').then(async (module) => {
  console.info('🐷[dynamic]', module.marker, await module.disposalTrace());
});

/**
 * Sample: render react component.
 */
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <div>Hello World 👋</div>
  </StrictMode>,
);
