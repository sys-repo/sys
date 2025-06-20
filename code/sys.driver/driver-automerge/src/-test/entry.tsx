import React from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../pkg.ts';

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
    /**
     * DevHarness:
     */
    const { render, useKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./-specs.ts');
    const el = await render(pkg, Specs, { hr: (e) => {}, style: { Absolute: 0 } });

    function App() {
      useKeyboard();
      return el;
    }

    const app = <App />;
    root.render(<React.StrictMode>{app}</React.StrictMode>);
  } else {
    /**
     * Entry/Splash:
     */
    const { useKeyboard } = await import('@sys/ui-react-devharness');
    const { Splash } = await import('./ui.Splash.tsx');

    function App() {
      useKeyboard();
      return <Splash />;
    }

    const app = <App />;
    root.render(<React.StrictMode>{app}</React.StrictMode>);
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
