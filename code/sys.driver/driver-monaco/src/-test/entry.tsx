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
    const { Specs } = await import('./entry.Specs.ts');
    const el = await render(pkg, Specs, { hr: 3, style: { Absolute: 0 } });
    function App() {
      useKeyboard();
      return el;
    }

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else {
    /**
     * Main:
     */
    const { MonacoEditor } = await import('@sys/driver-monaco');

    root.render(
      <React.StrictMode>
        <MonacoEditor style={{ Absolute: 0 }} theme={'Dark'} />
      </React.StrictMode>,
    );
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
