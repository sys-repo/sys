import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../common.ts';

/**
 * Render UI:
 */
console.info('🐷 ./entry.tsx → Pkg:💦', pkg);
const document = globalThis.document;
if (document) {
  document.title = pkg.name;
  document.body.style.overflow = 'hidden'; // NB: suppress rubber-band effect.
}

/**
 * MAIN entry:
 */
export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');
  const root = createRoot(document.getElementById('root')!);

  if (isDev) {
    const { render, useKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./entry.Specs.ts');

    const el = await render(pkg, Specs, {
      style: { Absolute: 0 },
      hr: (e) => {
        if (e.prev?.endsWith(': ObjectView')) return true;
        e.byRoots([
          'sys.ui.react.component',
          'sys.ui.react.component.player',
          'sys.ui.react.component.io',
        ]);
      },
    });
    function App() {
      useKeyboard();
      return el;
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } else {
    const { Splash } = await import('./ui.Splash.tsx');
    root.render(
      <StrictMode>
        <Splash style={{ Absolute: 0 }} />
      </StrictMode>,
    );
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
