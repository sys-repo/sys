import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Sample: render react component.
 */
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <div>Hello World 👋</div>
  </StrictMode>,
);
